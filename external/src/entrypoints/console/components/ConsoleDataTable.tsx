import { useCallback, useMemo, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  Button,
  ListItemText,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { title } from 'radash';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import { createUseStyles } from 'react-jss';
import { capitalizeFirstLetter } from 'common/util/index.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { RenderValue } from 'external/src/components/data/RenderValue.tsx';
import { createDynamicLink } from 'external/src/entrypoints/console/utils.ts';
import type { JsonObject } from 'common/types/index.ts';
import { Colors } from 'common/const/Colors.ts';

export const timestampKeys = [
  'createdTimestamp',
  'updatedTimestamp',
  'deletedTimestamp',
];
export function toColumnName(str: string) {
  if (['url', 'id'].includes(str)) {
    return str.toUpperCase();
  }
  // eg. createdTimestamp -> Created
  if (timestampKeys.includes(str)) {
    return capitalizeFirstLetter(str.replace(/Timestamp/i, ''));
  }
  // eg. organisationID -> Organisation ID
  return title(str);
}

const ROWS_PER_PAGE = 10;

type Props<T> = {
  data: T[] | null;
  dynamicLinks?: {
    [columnName: string]: {
      link: string;
      appendToLink?: keyof T; // for appending values of a column to link
    };
  };
  linkButton?: {
    label: string;
    link: string;
    appendToLink?: keyof T; // for appending values of a column to link
  };
  callbackButton?: { label: string; callback: (row: T) => unknown };
};

function ActionsButton({
  actions,
}: {
  actions: { label: string; callback: () => unknown }[];
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        sx={{ boxShadow: 'none', minWidth: '0', padding: '10px' }}
        onClick={handleClick}
      >
        <EllipsisHorizontalIcon style={{ height: 20 }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableScrollLock={true}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem>
          {actions.map(({ label, callback }, i) => {
            return (
              <ListItemText
                key={i}
                onClick={() => {
                  handleClose();
                  callback();
                }}
              >
                {label}
              </ListItemText>
            );
          })}
        </MenuItem>
      </Menu>
    </>
  );
}
const useStyles = createUseStyles({
  table: {
    height: '100px',
    marginBottom: Sizes.XXLARGE,
  },
  tableCell: {
    height: '100%',
    color: Colors.CONTENT_PRIMARY,
    whiteSpace: 'nowrap',
  },
});

export function ConsoleDataTable<T extends JsonObject>({
  data,
  dynamicLinks = {},
  linkButton,
  callbackButton,
}: Props<T>) {
  const classes = useStyles();
  const [page, setPage] = useState(0);

  const visibleRows = useMemo(() => {
    if (!data) {
      return [];
    }
    const rows = data;
    return rows.slice(
      page * ROWS_PER_PAGE,
      page * ROWS_PER_PAGE + ROWS_PER_PAGE,
    );
  }, [data, page]);

  if (!data) {
    return <Spinner animation="border" />;
  }

  if (data.length === 0) {
    return <Card.Text>No results</Card.Text>;
  }

  const columnNames = Object.keys(data[0]);

  return (
    <TableContainer>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            {columnNames.map((columnName, index) => {
              return (
                <TableCell
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                  key={index}
                >
                  <strong>{toColumnName(columnName)}</strong>
                </TableCell>
              );
            })}
            {linkButton && <TableCell key="actions">Actions</TableCell>}
            {callbackButton && <TableCell key="callback"></TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columnNames.map((columnName, index) => {
                const columnIsDynamicLink =
                  dynamicLinks && columnName in dynamicLinks;
                return (
                  <TableCell key={index} className={classes.tableCell}>
                    {columnIsDynamicLink ? (
                      <Link
                        to={createDynamicLink(
                          dynamicLinks[columnName].link,
                          row,
                          dynamicLinks[columnName].appendToLink,
                        )}
                        style={{
                          color: Colors.CONTENT_PRIMARY,
                        }}
                      >
                        <RenderValue
                          value={row[columnName as keyof T]}
                          isTimestamp={timestampKeys.includes(columnName)}
                        />
                      </Link>
                    ) : columnName === 'id' ? (
                      <Typography variant="monospaceTableCell">
                        {row[columnName]?.toString()}
                      </Typography>
                    ) : (
                      <RenderValue
                        value={row[columnName as keyof T]}
                        isTimestamp={timestampKeys.includes(columnName)}
                      />
                    )}
                  </TableCell>
                );
              })}
              {linkButton && (
                <TableCell key="action">
                  <Link
                    to={createDynamicLink(
                      linkButton.link,
                      row,
                      linkButton.appendToLink,
                    )}
                  >
                    <Button> {linkButton.label}</Button>
                  </Link>
                </TableCell>
              )}
              {callbackButton && (
                <TableCell key="callback">
                  <ActionsButton
                    actions={[
                      {
                        label: callbackButton.label,
                        callback: () => callbackButton.callback(row),
                      },
                    ]}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            {data.length > 10 && (
              <TablePagination
                count={data.length}
                rowsPerPage={ROWS_PER_PAGE}
                rowsPerPageOptions={[]}
                page={page}
                onPageChange={(
                  _: React.MouseEvent<HTMLButtonElement> | null,
                  newPage: number,
                ) => {
                  setPage(newPage);
                }}
              />
            )}
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
