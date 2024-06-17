# Loadtesting

This directory contains scripts and tools for performance testing of our various
services. There are two main strains of performance testing: improving the
performance of a single call, and seeing how the system handles many concurrent
users.

## General Tools

### `test_users.ts`

Note: Must be compiled, see [scripts/README.md](../README.md)

Creates or destroys a collection of test users in an org, to test orgs with
large numbers of users. Usage:

```
Commands:
  test_users.js create orgID [n]  create test users
  test_users.js delete [n]        delete test users
  test_users.js count             count test users
```

Users are deleted in reverse order of creation.

## Single Call Performance

Single-call performance is focused on profiling a single method. The main tool
used for this is
[ApacheBench](https://httpd.apache.org/docs/2.4/programs/ab.html), which allows
you to call a specific server call repeatedly and report statistics on its
performance. `ab` should typically already be installed on your machine as part
of Apache.

Typically, what we want to profile is the performance of a GraphQL request. To
get the body of a GraphQL request, you can use [create_request.cjs]. A typical
session looks like this:

```
$ ./scripts/load_test/create_request.cjs ./external/src/graphql/ViewerQuery.graphql > viewer.json

$ ./dist/scripts/load_test/test_users.js create 6bba8678-b14e-4af7-b2f2-05ee807dfa82 1000
Created 1000 fake users, now 1000 total

$ ab -c 1 -n 20 -p viewer.json -T application/json -H "Authorization: Bearer $TOKEN" https://localhost:8161/gql
This is ApacheBench, Version 2.3 <$Revision: 1879490 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient).....done


Server Software:
Server Hostname:        localhost
Server Port:            8161
SSL/TLS Protocol:       TLSv1.2,ECDHE-RSA-AES128-GCM-SHA256,2048,128
Server Temp Key:        ECDH X25519 253 bits
TLS Server Name:        localhost

Document Path:          /gql
Document Length:        2367068 bytes

Concurrency Level:      1
Time taken for tests:   3.439 seconds
Complete requests:      20
Failed requests:        19
   (Connect: 0, Receive: 0, Length: 19, Exceptions: 0)
Total transferred:      47098173 bytes
Total body sent:        25780
HTML transferred:       47093213 bytes
Requests per second:    5.82 [#/sec] (mean)
Time per request:       171.941 [ms] (mean)
Time per request:       171.941 [ms] (mean, across all concurrent requests)
Transfer rate:          13375.04 [Kbytes/sec] received
                        7.32 kb/s sent
                        13382.36 kb/s total

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        4   12   5.4     13      19
Processing:   129  160  57.1    137     370
Waiting:      127  157  56.4    134     366
Total:        134  172  56.1    151     380

Percentage of the requests served within a certain time (ms)
  50%    151
  66%    156
  75%    183
  80%    187
  90%    228
  95%    380
  98%    380
  99%    380
 100%    380 (longest request)
```

## Concurrent User Testing

Our main tool for testing concurrent user sessions is [k6](https://k6.io/),
which you'll need to install. It's available via `brew` or whatever other
package manager you use. It accepts a script executes it over and over with as
many concurrent copies as you want.

Our main k6 script is `load_test.cjs`, which contains detailed instructions in
its header. It replays a set of GraphQL operations recorded from a browser
session. A typical command line looks like this:

```
$ NUM_VUS=80; k6 run -e ENDPOINT="wss://localhost:8161/gql" -e JSON_FILE="startup.json" --stage 20s:$NUM_VUS --stage 20s:$NUM_VUS --stage 1s:0 --summary-trend-stats="avg,min,med,max,p(90),p(99.9),p(99.99),count" --out json=results.json scripts/load_test/load_test.cjs
```

"VU" stands for "virtual user", the k6 term for a concurrently executing
session. Options are passed to the script as environment variables, either in
your actual shell environment or passed via the `-e` flag.

Options:

- `TOKEN` - The auth token (without any "Bearer") to be sent with requests.
  Multiple tokens may be supplied, separated by colons, in which case
  the VUs will be divided equally between them. Required.
- `ENDPOINT` - The GraphQL websocket endpoint to connect to. Required.
- `HAR_FILE` - The requests to make. See "Creating a HAR file" below. One of
  this or `JSON_FILE` is required.
- `JSON_FILE` - The preprocessed behavior file. See `process_har.mjs` below. One
  of this or `HAR_FILE` is required.
- `URLS_TO_REPLACE` - A pipe-separated list of URLs to be replaced with per-VU
  synthetic URLs. Useful for testing how the server behaves under traffic to
  different sites rather than lots of users on the same site. Optional.

### Creating a HAR file

- Open the browser and go to the extension's background page
- Open the Network tab and refresh it (CMD+R)
- Make sure you see a new /gql websocket connection
- Perform some actions in the extension (navigate to pages, click around in the
  sidebar, etc). Don't perform any non-replayable actions, such as sending a
  message.
- Return to the network tab, right-click on the /gql operation, and choose "Save
  all as HAR with content"

### `process_har.mjs`

Reads in a HAR file and outputs a JSON file with the same information.
`load_test.cjs` can load either option, but the JSON file is easier to read and
manipulate if you want to adjust the test (remove some operations, change
timings, etc).

### `summarize_results.mjs`

Reads in a k6 JSON results file and displays some additional statistics, such as
the average runtime per operation name.
