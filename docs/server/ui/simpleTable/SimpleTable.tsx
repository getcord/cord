/** @jsxImportSource @emotion/react */

import * as React from 'react';

type SimpleTableData = [React.ReactNode, React.ReactNode][];

type SimpleTableProps = {
  data: SimpleTableData;
  firstColumnLabel?: React.ReactNode;
  secondColumnLabel?: React.ReactNode;
};

function SimpleTable({
  data,
  firstColumnLabel,
  secondColumnLabel,
}: SimpleTableProps) {
  return (
    <dl
      css={{
        display: 'grid',
        gridTemplateColumns: 'auto auto',
        maxWidth: '800px',
        '& dt, & dd': {
          fontSize: '14px',
          padding: '8px 8px 16px 8px',
          borderBottom: '1px var(--color-greylight) solid',
        },
      }}
    >
      <div
        css={{
          borderBottom: '1px var(--color-greylight) solid',
          fontSize: '14px',
          padding: 8,
        }}
      >
        <strong>{firstColumnLabel || 'Name'}&nbsp;</strong>
      </div>
      <div
        css={{
          borderBottom: '1px var(--color-greylight) solid',
          fontSize: '14px',
          padding: 8,
        }}
      >
        <strong>{secondColumnLabel || 'Value'}&nbsp;</strong>
      </div>
      {data.map(([firstCol, secondCol], idx) => {
        return (
          <React.Fragment key={idx}>
            <dt>{firstCol}</dt>
            <dd>{secondCol}</dd>
          </React.Fragment>
        );
      })}
    </dl>
  );
}

export default SimpleTable;
