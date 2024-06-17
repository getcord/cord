import { useMemo } from 'react';
import { Alert, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelectQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import type {
  DataTableQueries,
  JsonObject,
  JsonValue,
} from 'common/types/index.ts';
import { capitalize } from 'external/src/entrypoints/admin/data/util.tsx';
import { RenderValue } from 'external/src/components/data/RenderValue.tsx';

type Props = {
  query: DataTableQueries;
  parameters?: JsonObject;
  dynamicLinks?: { [columnName: string]: string };
  customColumns?: {
    [columnName: string]: (data: JsonValue) => JSX.Element | null;
  };
  elementBelowTable?: JSX.Element;
};

export function ObjectInfo({
  query,
  parameters,
  dynamicLinks,
  customColumns,
  elementBelowTable,
}: Props) {
  const { data, loading, error } = useSelectQuery({
    variables: { query, parameters: parameters || {} },
  });

  return useMemo(() => {
    if (loading) {
      return <Spinner animation="border" />;
    }

    if (error) {
      return <Alert variant={'danger'}>{error.message}</Alert>;
    }

    if (!data || data.select.length === 0) {
      return <>No data</>;
    }

    const columns = Object.keys(data.select[0]);

    return (
      <>
        <Table striped={true} bordered={true}>
          <tbody>
            {columns.map((column, columnIndex) => {
              const isDynamicLink =
                dynamicLinks && Object.keys(dynamicLinks).includes(column);
              const isCustom =
                customColumns && Object.keys(customColumns).includes(column);
              return (
                <tr key={columnIndex}>
                  <th key={columnIndex}>{capitalize(column)}</th>
                  {data.select.map((row, rowIndex) => {
                    const datum = row[column];
                    if (isCustom && row[column]) {
                      const customElem = customColumns[column](datum!);
                      return <td key={rowIndex}>{customElem}</td>;
                    } else if (isDynamicLink && datum) {
                      const mkLink = (v: string) => (
                        <Link to={dynamicLinks[column] + '/' + v}>
                          <RenderValue value={v} forceJSONExpanded={true} />
                        </Link>
                      );
                      if (Array.isArray(datum)) {
                        return (
                          <td key={rowIndex}>
                            <ol>
                              {datum.map((entry) => (
                                <li key={String(entry)}>
                                  {mkLink(entry as string)}
                                </li>
                              ))}
                            </ol>
                          </td>
                        );
                      } else {
                        return (
                          <td key={rowIndex}>{mkLink(datum as string)}</td>
                        );
                      }
                    }
                    return (
                      <td key={rowIndex}>
                        <RenderValue
                          value={row[column]}
                          forceJSONExpanded={true}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
        {elementBelowTable}
      </>
    );
  }, [loading, error, data, elementBelowTable, dynamicLinks, customColumns]);
}
