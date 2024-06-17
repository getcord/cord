import { Helmet } from 'react-helmet';
import { Spinner, Table } from 'react-bootstrap';
import { Link } from 'external/src/components/ui/Link.tsx';
import { DataTableQueries } from 'common/types/index.ts';
import { useSelectQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import { BrowserAndOSCharts } from 'external/src/entrypoints/admin/components/BrowserAndOSCharts.tsx';

export function Tools() {
  const { data: browserMetrics } = useSelectQuery({
    variables: { query: DataTableQueries.BROWSER_METRICS, parameters: {} },
  });
  const { data: osMetrics } = useSelectQuery({
    variables: { query: DataTableQueries.OS_METRICS, parameters: {} },
  });
  return (
    <>
      <Helmet>
        <title>Cord Admin</title>
      </Helmet>
      <Table striped={true} bordered={true}>
        <thead>
          <tr>
            <th>Category</th>
            <th>Links</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Design</td>
            <td>
              <Link
                href="https://www.figma.com/files/project/12944771/Product?fuid=875700559668528881"
                newTab={true}
              >
                Figma
              </Link>
            </td>
          </tr>
        </tbody>

        <tbody>
          <tr>
            <td>Monitoring</td>
            <td>
              <Link href="https://monitoring.cord.com/" newTab={true}>
                Grafana
              </Link>
              {' | '}
              <Link
                href={`https://monitoring.cord.com/explore?orgId=1&left=%5B"now-1h","now","Prod-read",%7B"refId":"A","instant":true,"range":true,"format":"table","timeColumn":"time","metricColumn":"none","group":%5B%5D,"where":%5B%7B"type":"macro","name":"$__timeFilter","params":%5B%5D%7D%5D,"select":%5B%5B%7B"type":"column","params":%5B"value"%5D%7D%5D%5D,"rawQuery":true,"rawSql":"SELECT%5Cn  $__time(time_column),%5Cn  value1%5CnFROM%5Cn  metric_table%5CnWHERE%5Cn  $__timeFilter(time_column)%5Cn"%7D%5D`}
                newTab={true}
              >
                Grafana - Prod-Read
              </Link>
              {' | '}
              <Link
                href="https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logsV2:logs-insights$3FqueryDetail$3D$257E$2528end$257E0$257Estart$257E-3600$257EtimeType$257E$2527RELATIVE$257Eunit$257E$2527seconds$257EeditorString$257E$2527fields*20message*2c*20*40timestamp*2c*20*40message*0a*7c*20filter*20level*20like*20*2ferror*2f*0a*7c*20sort*20*40timestamp*20desc*0a*7c*20limit*20200*0a$257EisLiveTail$257Efalse$257EqueryId$257E$252718edf297-bad0-47f1-8792-b14e8e0dd9aa$257Esource$257E$2528$257E$2527server.prod$2529$2529"
                newTab={true}
              >
                CloudWatch - logs level error in the past hour
              </Link>
              {' | '}
              <Link
                href="https://eu-west-2.console.aws.amazon.com/ec2autoscaling/home?region=eu-west-2#/details/prod-server?view=monitoring"
                newTab={true}
              >
                CW - EC2 Dashboards
              </Link>
              {' | '}
              <Link
                href="https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#dashboards:name=lolwhat"
                newTab={true}
              >
                CW - lolwhat Dashboards
              </Link>
            </td>
          </tr>
        </tbody>

        <tbody>
          <tr>
            <td>Engineering</td>
            <td>
              <Link
                href="https://app.launchdarkly.com/default/production/features"
                newTab={true}
              >
                Launch Darkly
              </Link>
              {' | '}
              <Link
                href="https://oncall.cord.com/team/Frontliners"
                newTab={true}
              >
                Frontliners
              </Link>
            </td>
          </tr>
        </tbody>

        <tbody>
          <tr>
            <td>Cord </td>
            <td>
              <Link href="https://docs.cord.com/v3/" newTab={true}>
                Docs
              </Link>
            </td>
          </tr>
        </tbody>

        <tbody>
          <tr>
            <td>Analytics </td>
            <td>
              <Link href="https://manage.app.preset.io/app/" newTab={true}>
                Preset
              </Link>
            </td>
          </tr>
        </tbody>
      </Table>
      <h2>Overall Metrics — Production Apps</h2>
      {browserMetrics && osMetrics ? (
        <BrowserAndOSCharts
          // count() returns a string, but we need an int
          browsers={browserMetrics.select.map(({ key, count }) => ({
            key,
            count: parseInt(count as string, 10),
          }))}
          operatingSystems={osMetrics.select.map(({ key, count }) => ({
            key,
            count: parseInt(count as string, 10),
          }))}
        />
      ) : (
        <Spinner animation="border" />
      )}
    </>
  );
}
