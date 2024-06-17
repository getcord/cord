import { Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCustomerApplicationsQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import { ApplicationCreateForm } from 'external/src/entrypoints/admin/components/ApplicationCreateForm.tsx';
import { RenderValue } from 'external/src/components/data/RenderValue.tsx';
import { CopyButton } from 'external/src/entrypoints/admin/components/CopyButton.tsx';

export function TabApplications({ customerID }: { customerID: string }) {
  const { data: applicationData, loading: applicationsLoading } =
    useCustomerApplicationsQuery({
      variables: { customerID: customerID },
    });

  if (applicationsLoading) {
    return <Spinner animation="border" />;
  }

  return (
    <>
      <Table striped={true} bordered={true}>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {applicationData?.customerApplications.map((row, index) => (
            <tr key={index}>
              <td>
                <Link to={AdminRoutes.APPLICATIONS + '/' + row?.id}>
                  <RenderValue
                    value={row?.id ?? 'UNKNOWN'}
                    forceJSONExpanded={true}
                  />
                </Link>
                <CopyButton value={row?.id} />
              </td>
              <td>{row?.name ?? 'UNKNOWN'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ApplicationCreateForm customerID={customerID} />
    </>
  );
}
