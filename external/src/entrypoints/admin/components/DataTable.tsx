import { useCallback, useMemo, useState } from 'react';
import { Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import uFuzzy from '@leeoniya/ufuzzy';
import { createUseStyles } from 'react-jss';
import { useSelectQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import type {
  DataTableQueries,
  JsonObject,
  JsonValue,
} from 'common/types/index.ts';
import { capitalize } from 'external/src/entrypoints/admin/data/util.tsx';
import { RenderValue } from 'external/src/components/data/RenderValue.tsx';
import { CopyButton } from 'external/src/entrypoints/admin/components/CopyButton.tsx';
import { isDefined } from 'common/util/index.ts';

type ActionsRenderer = (row: any) => JSX.Element;
type ValueRenderer = (
  data: JsonValue | undefined,
  defaultRender: JSX.Element,
) => JSX.Element;
type RowBackgroundColorRenderer = (row: any) => string | undefined;

type Props = {
  query?: DataTableQueries;
  parameters?: JsonObject;
  data?: JsonObject[];
  title?: string;
  forceJSONExpanded?: boolean;
  filter?: (data: JsonObject) => boolean;
  transform?: { [columnName: string]: (data: JsonValue) => JsonValue };
  sort?: { [columnName: string]: (a: any, b: any) => number };
  render?: { [columnName: string]: ValueRenderer };
  actions?: ActionsRenderer;
  rowBackgroundColor?: RowBackgroundColorRenderer;
  dynamicLinks?: { [columnName: string]: string };
};

const useStyles = createUseStyles({
  datatable: {
    '& th': {
      whiteSpace: 'nowrap',
      cursor: 'pointer',
    },
  },
});

export function DataTable({
  query,
  parameters,
  data,
  title,
  forceJSONExpanded = false,
  filter,
  transform,
  render,
  sort: sorters,
  actions,
  rowBackgroundColor,
  dynamicLinks,
}: Props) {
  const styles = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  // Sort value stores [column-id, is-ascending], undefined means no sorting
  const [sort, setSort] = useState<[string, boolean]>();

  const { data: selectResponse } = useSelectQuery({
    skip: !isDefined(query),
    variables: { query: query!, parameters: parameters || {} },
  });

  const rows = useMemo(() => {
    let result = data ?? selectResponse?.select;

    if (!result) {
      return undefined;
    }

    if (filter) {
      result = result.filter(filter);
    }

    if (transform) {
      result = result.map((row) => {
        const newRow: JsonObject = {};
        for (const k of Object.keys(row)) {
          if (k in transform && row[k] !== undefined) {
            newRow[k] = transform[k](row[k]!);
          } else {
            newRow[k] = row[k];
          }
        }
        return newRow;
      });
    }

    return result;
  }, [data, selectResponse, filter, transform]);

  const haystack: string[] = useMemo(
    () =>
      rows?.map((row) =>
        Object.values(row)
          .map((value) => JSON.stringify(value))
          .join(' '),
      ) ?? [],
    [rows],
  );

  const uf = useMemo(() => new uFuzzy(), []);
  const searchedRows = useMemo(() => {
    if (!rows) {
      return rows;
    }
    const searchIndexes = uf.filter(haystack, searchTerm);
    return searchIndexes.map((idx) => rows[idx]);
  }, [rows, uf, haystack, searchTerm]);

  const sortedRows = useMemo(() => {
    if (!searchedRows || !sort) {
      return searchedRows;
    }
    const sortConst = sort[1] ? 1 : -1;
    if (sorters?.[sort[0]]) {
      const sorter = sorters[sort[0]];
      return [...searchedRows].sort((a, b) => {
        return sortConst * sorter(a[sort[0]], b[sort[0]]);
      });
    }
    return [...searchedRows].sort((a, b) => {
      const aVal = a[sort[0]] ?? '';
      const bVal = b[sort[0]] ?? '';
      if (
        (typeof aVal === 'number' && typeof bVal === 'number') ||
        (typeof aVal === 'boolean' && typeof bVal === 'boolean')
      ) {
        if (aVal < bVal) {
          return -1 * sortConst;
        } else if (aVal > bVal) {
          return 1 * sortConst;
        } else {
          return 0;
        }
      }
      const aStr = aVal.toString();
      const bStr = bVal.toString();
      return aStr.toLowerCase().localeCompare(bStr.toLowerCase()) * sortConst;
    });
  }, [searchedRows, sort, sorters]);

  const onChangeSearchTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm],
  );

  return useMemo(() => {
    if (!rows) {
      return (
        <>
          {title && <h2>{title}</h2>}
          <Spinner animation="border" />
        </>
      );
    }

    if (rows.length === 0) {
      return (
        <>
          {title && <h2>{title}</h2>}
          <>No results</>
        </>
      );
    }

    const columns = Object.keys(rows[0]);

    return (
      <>
        {title && (
          <h2>
            {title} ({rows.length})
          </h2>
        )}
        <input
          type="text"
          placeholder="Filter table"
          value={searchTerm}
          onChange={onChangeSearchTerm}
          style={{ margin: '8px 0' }}
        ></input>
        <Table striped={true} bordered={true} className={styles.datatable}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  onClick={() =>
                    setSort([column, sort?.[0] === column ? !sort[1] : true])
                  }
                >
                  {capitalize(column)}
                  {sort?.[0] === column ? (sort[1] ? ' ▲' : ' ▼') : ''}
                </th>
              ))}

              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedRows?.length ? (
              sortedRows.map((row) => (
                <Row
                  key={JSON.stringify(row)}
                  row={row}
                  columns={columns}
                  actions={actions}
                  render={render}
                  dynamicLinks={dynamicLinks}
                  forceJSONExpanded={forceJSONExpanded}
                  rowBackgroundColor={rowBackgroundColor}
                />
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>No results</td>
              </tr>
            )}
          </tbody>
        </Table>
      </>
    );
  }, [
    rows,
    sortedRows,
    sort,
    title,
    searchTerm,
    onChangeSearchTerm,
    actions,
    render,
    dynamicLinks,
    forceJSONExpanded,
    rowBackgroundColor,
    styles,
  ]);
}

function Row({
  row,
  columns,
  actions,
  render,
  dynamicLinks,
  forceJSONExpanded,
  rowBackgroundColor,
}: {
  row: JsonObject;
  columns: string[];
  forceJSONExpanded?: boolean;
  rowBackgroundColor?: RowBackgroundColorRenderer;
  dynamicLinks?: { [columnName: string]: string };
  actions?: ActionsRenderer;
  render?: { [columnName: string]: ValueRenderer };
}) {
  return (
    <tr
      style={
        rowBackgroundColor
          ? { backgroundColor: rowBackgroundColor(row) }
          : undefined
      }
    >
      {columns.map((column, index) => {
        const value = row[column];
        const valueComponent = (
          <RenderValue value={value} forceJSONExpanded={forceJSONExpanded} />
        );

        let renderedValue = valueComponent;

        const isDynamicLink =
          dynamicLinks && Object.keys(dynamicLinks).includes(column);
        if (isDynamicLink && dynamicLinks && value) {
          renderedValue = (
            <>
              <Link to={dynamicLinks[column] + '/' + value}>
                {valueComponent}
              </Link>
              <CopyButton value={value} />
            </>
          );
        }

        if (render?.[column]) {
          renderedValue = render[column](value, renderedValue);
        }

        return <td key={index}>{renderedValue}</td>;
      })}
      {actions && <td>{actions(row)}</td>}
    </tr>
  );
}
