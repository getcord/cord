import HighchartsReact from 'highcharts-react-official';
import * as Highcharts from 'highcharts';

import { createUseStyles } from 'react-jss';
import type { JsonObject } from 'common/types/index.ts';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
});

export function BrowserAndOSCharts({
  browsers,
  operatingSystems,
}: {
  browsers: JsonObject[];
  operatingSystems: JsonObject[];
}) {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <HighchartsReact.default
        highcharts={Highcharts}
        options={{
          chart: {
            type: 'pie',
            height: '300px',
          },

          title: {
            text: 'Browser Share',
          },

          tooltip: {
            pointFormat: '<b>{point.percentage:.1f}%</b>',
          },

          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                format: '{point.name}: {point.percentage:.1f}%',
              },
            },
          },

          series: [
            {
              name: 'Browsers',
              data: percentagesWithOther(browsers as any),
            },
          ],
        }}
      />
      <HighchartsReact.default
        highcharts={Highcharts}
        options={{
          chart: {
            type: 'pie',
            height: '300px',
          },

          title: {
            text: 'OS Share',
          },

          tooltip: {
            pointFormat: '<b>{point.percentage:.1f}%</b>',
          },

          plotOptions: {
            pie: {
              allowPointSelect: true,
              dataLabels: {
                enabled: true,
                format: '{point.name}: {point.percentage:.1f}%',
              },
            },
          },

          series: [
            {
              name: 'Operating Systems',
              data: percentagesWithOther(operatingSystems as any),
            },
          ],
        }}
      />
    </div>
  );
}

/**
 * Convert absolute numbers in `count` to percentages in `y`, and combine all
 * entries with less than 1% of the total count into a single "Others" entry.
 */
function percentagesWithOther(
  values: { key: string; count: number }[],
): { name: string; y: number }[] {
  const total = values.reduce((a, value) => a + value.count, 0);
  const other = values
    .filter((v) => v.count / total < 0.01)
    .reduce((a, v) => a + v.count, 0);
  return [
    ...values
      .filter((v) => v.count / total >= 0.01)
      .map((v) => ({ name: v.key, y: (v.count / total) * 100 })),
    ...(other > 0 ? [{ name: 'Other', y: (other / total) * 100 }] : []),
  ];
}
