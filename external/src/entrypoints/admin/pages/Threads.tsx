import { useCallback, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button, Form, InputGroup, Table } from 'react-bootstrap';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type { JsonObject, UUID } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { DataTable } from 'external/src/entrypoints/admin/components/DataTable.tsx';

type Filter = {
  field: string;
  match: 'any' | 'exact' | 'startsWith';
  matchValue: string;
};

export function Threads() {
  const [applicationID, setApplicationID] = useState<UUID>();
  const applicationIDInputRef = useRef<HTMLInputElement | null>(null);

  const [draftFilters, setDraftFilters] = useState<Array<Filter>>([]);
  const [appliedFilters, setAppliedFilters] = useState<Array<Filter>>([]);

  const filterFunction = useCallback(
    (row: JsonObject) => {
      for (const filter of appliedFilters) {
        if (!filter.field) {
          continue;
        }

        const contextData = row['contextData'] as JsonObject | undefined;
        if (!contextData) {
          // should never happen but just in case
          return true;
        }

        const value = contextData[filter.field];
        if (value === undefined || value === null) {
          return false;
        }

        if (filter.match === 'exact') {
          if (typeof value === 'string' && value !== filter.matchValue) {
            return false;
          }
          if (
            typeof value === 'number' &&
            value !== parseInt(filter.matchValue)
          ) {
            return false;
          }
          if (
            typeof value === 'boolean' &&
            value !== (filter.matchValue === 'true' ? true : false)
          ) {
            return false;
          }
        }

        if (
          filter.match === 'startsWith' &&
          typeof value === 'string' &&
          !value.startsWith(filter.matchValue)
        ) {
          return false;
        }
      }

      return true;
    },
    [appliedFilters],
  );

  return (
    <>
      <Helmet>
        <title>Cord Admin - Threads Contexts</title>
      </Helmet>

      <Form.Group style={{ width: 600 }}>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Application ID</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="text"
            required={true}
            width={20}
            defaultValue={applicationID}
            ref={applicationIDInputRef}
          />
          <InputGroup.Append>
            <Button
              variant="primary"
              onClick={() => {
                if (applicationIDInputRef.current) {
                  setApplicationID(applicationIDInputRef.current.value.trim());
                }
              }}
            >
              Inspect
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Group>

      {applicationID && (
        <>
          <h3>Page Context Filters</h3>
          <Table striped={true} bordered={true}>
            {draftFilters.map((filter, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    placeholder="Context Field Name"
                    value={filter.field}
                    onChange={(e) => {
                      setDraftFilters(
                        draftFilters.map((f, fIndex) =>
                          fIndex !== index
                            ? f
                            : { ...f, field: e.target.value },
                        ),
                      );
                    }}
                  />
                </td>
                <td colSpan={filter.match === 'any' ? 2 : 1}>
                  <select
                    value={filter.match}
                    onChange={(e) => {
                      setDraftFilters(
                        draftFilters.map((f, fIndex) =>
                          fIndex !== index
                            ? f
                            : { ...f, match: e.target.value as typeof f.match },
                        ),
                      );
                    }}
                  >
                    <option value={'any'}>Contains any value</option>
                    <option value={'exact'}>Value is exactly</option>
                    <option value={'startsWith'}>Value starts with</option>
                  </select>
                </td>
                {filter.match !== 'any' && (
                  <td>
                    <input
                      type="text"
                      placeholder="Value"
                      value={filter.matchValue}
                      onChange={(e) => {
                        setDraftFilters(
                          draftFilters.map((f, fIndex) =>
                            fIndex !== index
                              ? f
                              : { ...f, matchValue: e.target.value },
                          ),
                        );
                      }}
                    />
                  </td>
                )}
                <td width="10">
                  <Button
                    variant="danger"
                    onClick={() => {
                      setDraftFilters(
                        draftFilters.filter((f, fIndex) => fIndex !== index),
                      );
                    }}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            <tfoot>
              <tr>
                <td>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setDraftFilters([
                        ...draftFilters,
                        {
                          field: '',
                          match: 'any',
                          matchValue: '',
                        },
                      ])
                    }
                  >
                    Add filter
                  </Button>
                  {!isEqual(draftFilters, appliedFilters) && (
                    <>
                      {' '}
                      <Button
                        onClick={() => {
                          setAppliedFilters([...draftFilters]);
                        }}
                      >
                        Apply filters
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            </tfoot>
          </Table>
        </>
      )}

      {applicationID && (
        <DataTable
          title="Threads + Contexts"
          query={DataTableQueries.PAGE_CONTEXTS}
          parameters={{ applicationID }}
          forceJSONExpanded={true}
          filter={filterFunction}
        />
      )}
    </>
  );
}
