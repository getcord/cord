import HighchartsReact from 'highcharts-react-official';
import * as Highcharts from 'highcharts';
import { useContext, useRef } from 'react';
import type { ChartCommentMetadata } from 'docs/server/routes/components/pin/ChartExample.tsx';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';

// Draws a simple series chart. Example taken directly from
// Highcharts examples docs page.
type ChartProps = {
  forwardRef: React.RefObject<HighchartsReact.default.RefObject>;
  setOpenComment: (threadId: string) => void;
  addCommentToChart: (threadId: string, metadata: ChartCommentMetadata) => void;
  onChartRedraw: React.RefObject<() => void>;
  onMouseEnterPoint: () => void;
  onMouseLeavePoint: () => void;
};
function Chart({
  forwardRef,
  addCommentToChart,
  setOpenComment,
  onChartRedraw,
  onMouseEnterPoint,
  onMouseLeavePoint,
}: ChartProps) {
  const authContext = useContext(AuthContext);
  const chartId = 'example-chart-id'; // unique stable ID of this chart
  const addCommentToChartRef = useUpdatingRef(addCommentToChart);
  const setOpenCommentRef = useUpdatingRef(setOpenComment);
  const chartOptions = useRef({
    chart: {
      events: {
        redraw: () => onChartRedraw.current?.(),
      },
    },

    plotOptions: {
      series: {
        label: {
          connectorAllowed: false,
        },
        pointStart: 2010,
        events: {
          click: function (evt: Highcharts.PointClickEventObject) {
            const metadata = {
              type: 'chart',
              chartId: chartId,
              seriesId: evt.point.series.userOptions.id!,
              x: evt.point.x,
              y: evt.point.y!,
            } as const;
            // NOTE: Allow only one comment per point by using the point x,y in threadId
            const commentId = `${orgID}_${metadata.chartId}_${metadata.seriesId}_${metadata.x}_${metadata.y}`;
            addCommentToChartRef.current(commentId, metadata);
            setOpenCommentRef.current(commentId);
          },
          mouseOver: onMouseEnterPoint,
          mouseOut: onMouseLeavePoint,
        },
      },
    },

    title: {
      text: 'U.S Solar Employment Growth by Job Category, 2010-2020',
      align: 'left',
    },

    subtitle: {
      // eslint-disable-next-line @cspell/spellchecker
      text: 'Source: <a href="https://irecusa.org/programs/solar-jobs-census/" target="_blank">IREC</a>',
      align: 'left',
    },

    yAxis: {
      title: {
        text: 'Number of Employees',
      },
    },

    xAxis: {
      accessibility: {
        rangeDescription: 'Range: 2010 to 2020',
      },
    },

    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
    },

    series: [
      {
        id: 'id-1',
        name: 'Installation & Developers',
        visible: false,
        data: [
          43934, 48656, 65165, 81827, 112143, 142383, 171533, 165174, 155157,
          161454, 154610,
        ],
      },
      {
        id: 'id-2',
        name: 'Manufacturing',
        data: [
          24916, 37941, 29742, 29851, 32490, 30282, 38121, 36885, 33726, 34243,
          31050,
        ],
      },
      {
        id: 'id-3',
        name: 'Sales & Distribution',
        data: [
          11744, 30000, 16005, 19771, 20185, 24377, 32147, 30912, 29243, 29213,
          25663,
        ],
      },
      {
        id: 'id-4',
        name: 'Operations & Maintenance',
        data: [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          11164,
          11218,
          10077,
        ],
      },
      {
        id: 'id-5',
        name: 'Other',
        data: [
          21908, 5548, 8105, 11248, 8989, 11816, 18274, 17300, 13053, 11906,
          10077,
        ],
      },
    ],

    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500,
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom',
            },
          },
        },
      ],
    },
  });
  const orgID = authContext.organizationID;
  if (!orgID) {
    return null;
  }

  return (
    <HighchartsReact.default
      ref={forwardRef}
      highcharts={Highcharts}
      options={chartOptions.current}
    />
  );
}

// Reimplementation of our internal useUpdatingRef so that this
// code be opensourced one day
function useUpdatingRef<T>(val: T) {
  const ref = useRef<T>(val);
  ref.current = val;
  return ref;
}

export default Chart;
