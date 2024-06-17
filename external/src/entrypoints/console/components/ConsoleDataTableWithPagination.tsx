import {
  CircularProgress,
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
import { createUseStyles } from 'react-jss';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Sizes } from 'common/const/Sizes.ts';

const ROWS_PER_PAGE = 10;

const useStyles = createUseStyles({
  tableContainer: {
    backgroundImage: `
    linear-gradient(to right, white, white),
    linear-gradient(to right, white, white),
    linear-gradient(to right, rgba(0,0,0,.10), rgba(255,255,255,0)),
    linear-gradient(to left, rgba(0,0,0,.10), rgba(255,255,255,0))`,
    backgroundPosition: 'left center, right center, left center, right center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'white',
    backgroundSize: '20px 100%, 20px 100%, 10px 100%, 10px 100%',
    backgroundAttachment: 'local, local, scroll, scroll',
  },
  table: {
    height: '100px',
    marginBottom: Sizes.XXLARGE,
  },
  fetchingMore: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    gap: Sizes.MEDIUM,
    padding: Sizes.XLARGE,
  },
  pagination: { display: 'flex', justifyContent: 'flex-end' },
  noWrap: { textWrap: 'nowrap' },
});

export interface GetDataResponse<T> {
  data: T[];
  totalItems: number;
  token: string | null;
}

export interface RenderRowParams<T> {
  row: T;
  refetch: () => Promise<void>;
}
interface ConsoleDataTableWithPaginationProps<T> {
  queryKey: string[];
  headers: string[];
  getData: (token: string | null) => Promise<GetDataResponse<T>>;
  renderRow: (params: RenderRowParams<T>) => ReactNode;
}

export function ConsoleDataTableWithPagination<T>({
  headers,
  getData,
  renderRow,
  queryKey,
}: ConsoleDataTableWithPaginationProps<T>) {
  const [totalRowCount, setTotalRowCount] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const getPage = useCallback(
    async ({ pageParam = null }) => {
      const data = await getData(pageParam);
      setTotalRowCount(data.totalItems);
      return data;
    },
    [getData],
  );

  const {
    data,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: getPage,
    getNextPageParam: (lastPage) => lastPage.token,
  });

  const allRows = useMemo(() => {
    return data?.pages.flatMap((dataPage) => dataPage.data) ?? [];
  }, [data?.pages]);

  const visibleRows = useMemo(() => {
    return allRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
  }, [allRows, page]);

  const fetchMoreRows = useCallback(async () => {
    if (isFetchingNextPage) {
      return;
    }

    await fetchNextPage();
  }, [fetchNextPage, isFetchingNextPage]);

  const onPageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      if (isFetchingNextPage) {
        return;
      }
      setPage(newPage);

      // TODO: if the page returns fewer results than the page size, we don't fetch until
      // the page is full. We should.
      if (allRows.length <= (newPage + 1) * ROWS_PER_PAGE && hasNextPage) {
        void fetchMoreRows();
      }
    },
    [allRows.length, fetchMoreRows, isFetchingNextPage, hasNextPage],
  );

  const refetchTable = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const classes = useStyles();

  if (isFetching) {
    return <CircularProgress aria-label="Fetching data" />;
  }

  const totalPages = Math.ceil((totalRowCount ?? 0) / ROWS_PER_PAGE);

  return (
    <>
      <TableContainer className={classes.tableContainer}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              {headers.map((item) => (
                <TableCell key={item} className={classes.noWrap}>
                  <strong>{item}</strong>
                </TableCell>
              ))}
              <TableCell key="more" />
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row: T) => {
              return renderRow({ row, refetch: refetchTable });
            })}
          </TableBody>
          <TableFooter>
            <TableRow></TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {isFetchingNextPage ? (
        <Typography variant="body2" className={classes.fetchingMore}>
          <CircularProgress size="16px" aria-label="Fetching more rows" />
        </Typography>
      ) : null}
      {totalRowCount !== null && totalRowCount > ROWS_PER_PAGE && (
        <div className={classes.pagination}>
          <TablePagination
            component="div"
            count={totalRowCount}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[]}
            page={page}
            onPageChange={onPageChange}
            nextIconButtonProps={{
              disabled:
                page === totalPages - 1 || isFetching || isFetchingNextPage,
            }}
          />
        </div>
      )}
    </>
  );
}
