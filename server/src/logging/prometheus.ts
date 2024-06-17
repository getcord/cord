import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as url from 'url';
import { promises as fsPromises } from 'fs';
import * as prom from 'prom-client';
import type { Viewer } from 'server/src/auth/index.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

import type { ListenPort } from 'server/src/util/port.ts';
import { getHostPortion } from 'server/src/util/port.ts';

// Our build process replaces `BUILDCONSTANTS.loggingProcessName` with an
// appropriate string (e.g. 'server' or 'asyncWorker')
declare const BUILDCONSTANTS: { loggingProcessName: string };

// Prometheus is an open source monitoring framework. The way it works is that
// a central Prometheus server periodically (by default once a minute) connects
// to the processes it is set up to monitor and obtains their metrics
// measurements. Prometheus stores these time series of data, and typically
// another open source product, Grafana, is used for visualising this data,
// building dashboards etc.
//
// The kind of metrics that get collected include counters ("How many requests
// of type X have we had?", which will be displayed as a graph showing
// X-requests per second), and histograms e.g. for execution speed ("How many
// requests of type X have had that got processed faster than Y seconds?",
// which will be displayed as a graph showing the mean, median or p90
// processing time over the day).
//
// So, for Prometheus to be able to show us metrics about our server, our
// server has to collect those metrics and expose them so that the Prometheus
// server can scrape them periodically. That is what this file does.
//
// The Prometheus client library (prom-client) does all of the hard work here,
// of pre-aggregating the metrics in the format that the Prometheus server
// expects. In this file, we just define a few helper functions that make it
// even easier to define metrics and instrument the code to collect them.
//
// One important thing to understand is that the Prometheus client does not
// store a list of all individual events, but aggregates data immediately. So,
// e.g., when we instrument our code to keep track of how long certain GraphQL
// operations take, the Prometheus client won't store the execution time of
// each individual request, but rather increments a counter for a certain time
// range. So the information that an individual request took 15ms is lost, and
// instead the counter for "events between 10 and 20ms" is incremented. This
// makes the collection of metrics very lightweight, and we do not have to
// worry about the overhead it introduces. On the other hand we, of course,
// don't have precise data for every single event anymore, but in practice, if
// there are hundreds or thousands of such events, the bucketed data works just
// as well.

const register = new prom.Registry();
if (process.env.CORD_WORKER_NAME) {
  // Remove any punctuation characters that might cause issues for prometheus
  const sanitizedWorkerName = process.env.CORD_WORKER_NAME.replace(
    /[^A-Za-z0-9 _-]/g,
    '',
  );
  register.setDefaultLabels({ worker: sanitizedWorkerName });
}
prom.AggregatorRegistry.setRegistries([register]);
prom.collectDefaultMetrics({
  register,
  prefix: `${BUILDCONSTANTS.loggingProcessName}_`,
});

// Helper functions to easily create metrics. They are bound to the Prometheus
// register whose metrics we expose here. These function also provide some
// reasonable defaults, e.g. the bucket boundaries for histograms.
export const Counter = (configuration: prom.CounterConfiguration<string>) =>
  new prom.Counter({ registers: [register], ...configuration });
export const Gauge = (configuration: prom.GaugeConfiguration<string>) =>
  new prom.Gauge({ registers: [register], ...configuration });
export const TimeHistogram = (
  configuration: prom.HistogramConfiguration<string>,
) =>
  new prom.Histogram({
    registers: [register],
    buckets: logBuckets(0.001, 10, 13),
    ...configuration,
  });
export function logBuckets(min: number, max: number, buckets: number) {
  // This function creates bucket boundaries for histograms that are
  // logarithmically equidistant.
  // E.g. logBuckets(0.001, 10, 5) -> [ 0.001, 0.01, 0.1, 1, 10 ].
  // If you increase bucket number from 5 to 9, then you get one additional
  // bucket boundary in the middle between each of those 5 in the example.
  // ([0.001, x*0.001, 0.01, x*0.01, 0.1, x*0.1, 1, x*1, 10] with x approx 3.16)
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const step = (logMax - logMin) / (buckets - 1);
  return [...Array(buckets).keys()].map((i) => min * 10 ** (i * step));
  // The default setting for histograms we use above in the `Histogram` helper
  // uses logBuckets(0.001, 10, 13), which covers the range from 1ms to 10s
  // and has the nice property that each bucket's upper limit is roughly
  // twice that of the previous bucket, and three buckets cover exactly a
  // factor of 10. In other words, the upper boundaries of the histogram
  // buckets are:
  // [ 0.001, 0.00215, 0.00464,
  //   0.01,  0.0215,  0.0464,
  //   0.1,   0.215,   0.464,
  //   1,     2.15,    4.64,
  //  10 ]
  // Anything faster than 1ms is counted in the first bucket, anything faster
  // in than 10s is counted in the last bucket, and anything slower than 10s
  // is counted as "slower than 10s" (Prometheus automatically adds one more
  // bucket with +Infinity as the upper limit.)
  //
  // * Why those limits? 0.001 and 10?
  // For example, our GraphQL operations (at the time of writing this)
  // typically are in the tenths or hundreds of milliseconds. The limits here
  // are chosen to cover that area well with some margin at both sides. More
  // generally: anything that's faster than a millisecond is so fast that we
  // don't need to worry about it, whereas anything near 10s is so slow that
  // it's effectively broken. So the range from 1ms to 10s is chosen to be
  // sure that we capture the relevant region. If we have a problem and, for
  // example, the execution time of some operation creeps up, than we still
  // capture that development until the execution time becomes longer than 10s,
  // but hopefully we would have spotted a problem before that happens.
  //
  // * Why 13 buckets?
  // 13 happens to be one of the numbers where we will have buckets lining up
  // with powers of 10, which is nice. Having more buckets means that we have
  // more precise information in our histograms, but it adds to the memory
  // overhead. 13 should be good enough to get a good idea what's going on.
  //
  // * Why "logarithmically equidistant"?
  // Since we use these histograms for measuring the timing of many different
  // kinds of processes, this is a good one-fits-all solution. If you knew
  // that you want to measure times in the range of, say, 10 to 20ms, than
  // you would probably just have a linear series of bucket boundaries (10,
  // 11, 12, ..., 20). However, to have a reasonably good resultion for
  // processes that take around 10ms and at the same time for those that take
  // around 100 or 1000ms, it's better to have a constant factor between
  // bucket boundaries. Here, the upper end of a bucket is at 2.15 times the
  // lower end, and that way we nicely spread out just 13 buckets on the wide
  // range from 1ms to 10s.
}

export function incCounterWithAppID<T extends string>(
  viewer: Viewer,
  counter: prom.Counter<T>,
  labels: prom.LabelValues<T> = {},
  value = 1,
): void {
  counter.inc(
    { appID: viewer.platformApplicationID || 'null', ...labels },
    value,
  );
}

// Ideally would be instantiated within the cluster-mode-only handler below, but
// having it out here means that even workers do it, working around this issue:
// https://github.com/siimon/prom-client/pull/449#issuecomment-922504343
const aggregatorRegistry = new prom.AggregatorRegistry();

export async function metricsMain(port: ListenPort, clusterMode: boolean) {
  const app = clusterMode
    ? (_req: http.IncomingMessage, res: http.ServerResponse) => {
        res.setHeader('Content-type', aggregatorRegistry.contentType);
        aggregatorRegistry.clusterMetrics().then(
          (metrics) => res.end(metrics),
          (err) => {
            anonymousLogger().logException(
              'aggregatorRegistry.clusterMetrics() threw an exception',
              err,
              undefined,
              undefined,
              'warn',
            );
            res.statusCode = 500;
            res.end(`${err.message}`);
          },
        );
      }
    : (_req: http.IncomingMessage, res: http.ServerResponse) => {
        res.setHeader('Content-type', register.contentType);
        register.metrics().then(
          (metrics) => res.end(metrics),
          (err) => {
            anonymousLogger().logException(
              'register.metrics() threw an exception',
              err,
              undefined,
              undefined,
              'warn',
            );
            res.statusCode = 500;
            res.end(`${err.message}`);
          },
        );
      };

  const server =
    process.env.NODE_ENV === 'development' && !process.env.IS_TEST
      ? https.createServer(
          {
            key: await fsPromises.readFile(
              path.posix.dirname(url.fileURLToPath(import.meta.url)) +
                '/localhost.key',
            ),
            cert: await fsPromises.readFile(
              path.posix.dirname(url.fileURLToPath(import.meta.url)) +
                '/localhost.crt',
            ),
          },
          app,
        )
      : http.createServer(app);

  // Start our server
  return await new Promise<void>((resolve, reject) => {
    server.addListener('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      resolve();
      const host = getHostPortion(server.address());
      anonymousLogger().info(
        `🚀 Serving Prometheus metrics at https://${host}/`,
      );
    });
  });
}
