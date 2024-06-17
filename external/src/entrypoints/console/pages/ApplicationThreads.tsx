import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { TableCell, TableRow, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { Link, useResolvedPath } from 'react-router-dom';

import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import type {
  EntityMetadata,
  Location,
  ThreadParticipant,
  FilterParameters,
  CoreThreadData,
  ServerListThreads,
} from '@cord-sdk/types';
import type {
  GetDataResponse,
  RenderRowParams,
} from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { ConsoleDataTableWithPagination } from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { DeletionConfirmationModal } from 'external/src/entrypoints/console/components/DeletionConfirmationModal.tsx';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { Filter } from 'external/src/entrypoints/console/components/Filter/Filter.tsx';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import { EmptyState } from 'external/src/entrypoints/console/components/EmptyState.tsx';
import { ApiInformationBlock } from 'external/src/entrypoints/console/components/ApiInformationBlock.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { JSONCell } from 'external/src/entrypoints/console/components/JSONCell.tsx';
import { MoreCell } from 'external/src/entrypoints/console/components/MoreCell.tsx';
import { TimestampCell } from 'external/src/entrypoints/console/components/TimestampCell.tsx';
import { useGetApplicationOrg } from 'external/src/entrypoints/console/hooks/useGetApplicationOrg.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';

const useStyles = createUseStyles({
  noWrap: { textWrap: 'nowrap' },
  plaintextCell: {
    textOverflow: 'ellipsis',
    maxWidth: 200,
    overflow: 'hidden',
  },
  link: {
    color: Colors.CONTENT_SECONDARY,
  },
  apiInformationBlock: { marginBlockEnd: Sizes.XLARGE },
});

// This is needed because we specify the type of some timestamps as Date
// but in reality we are given a string back from the REST API
// So we remove them from the return type and add them back as strings
// Doing this as a temporary thing to unblock myself but we should look
// at how we might want to fix this
type ThreadData = Omit<CoreThreadData, 'resolvedTimestamp' | 'participants'> & {
  resolvedTimestamp: string;
  participants: Omit<ThreadParticipant, 'lastSeenTimestamp'> & {
    lastSeenTimestamp: string;
  };
};

const LIMIT_THREADS = 35;
const HEADERS = [
  'ID',
  'Group ID',
  'Total',
  'User Messages',
  'Action Messages',
  'Deleted Messages',
  'Resolved',
  'Resolved timestamp',
  'Participants',
  'Subscribers',
  'Repliers',
  'Name',
  'URL',
  'Location',
  'Metadata',
  'Typing',
  '',
];

export function ApplicationThreads() {
  const baseUrl = useResolvedPath('').pathname;
  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const [locationFilter, setLocationFilter] = useState('');
  const [metadataFilter, setMetadataFilter] = useState('');
  const [queryUrl, setQueryUrl] = useState<URL | null>(null);
  const [threadsCount, setThreadsCount] = useState<number | null>(null);
  const [filtersParam, setFiltersParam] = useState<string | undefined>();

  const deleteThread = useCallback(
    async (threadID: string) => {
      if (!application) {
        return;
      }

      await fetch(`${API_ORIGIN}/v1/threads/${threadID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${application.serverAccessToken}`,
          'X-Cord-Source': 'console',
        },
      });
    },
    [application],
  );

  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  const hideDeletionModal = useCallback(() => {
    setDeletionModalVisible(false);
    setSelectedThread(null);
  }, []);

  const showDeletionModal = useCallback((threadID: string) => {
    setDeletionModalVisible(true);
    setSelectedThread(threadID);
  }, []);

  const confirmDeletion = useCallback(async () => {
    setDeletionModalVisible(false);
    await deleteThread(selectedThread as string);
  }, [selectedThread, deleteThread]);

  // create filters param which will force-update the queryKey which
  // in turn will fetch the new threads with the provided filters
  useEffect(() => {
    const filter: FilterParameters = {};
    if (locationFilter) {
      try {
        const json = JSON.parse(locationFilter) as Location;
        if (json) {
          filter['location'] = json;
        }
      } catch (e) {
        console.error(`Error parsing location filter`, e);
      }
    }
    if (metadataFilter) {
      try {
        const json = JSON.parse(metadataFilter) as EntityMetadata;
        if (json) {
          filter['metadata'] = json;
        }
      } catch (e) {
        console.error(`Error parsing metadata filter`, e);
      }
    }
    // make sure we update filters param to the right thing whether
    // the filters input are being updated or removed
    const filterPresent = Object.keys(filter).length > 0;
    if (filterPresent || filtersParam !== undefined) {
      setFiltersParam(filterPresent ? JSON.stringify(filter) : undefined);
    }
  }, [application?.id, locationFilter, metadataFilter, filtersParam]);

  const fetchThreads = useCallback(
    async (token: string | null): Promise<GetDataResponse<CoreThreadData>> => {
      const appendToken = token ? `&token=${token}` : '';

      const url = new URL(
        `${API_ORIGIN}/v1/threads?limit=${LIMIT_THREADS}${appendToken}`,
      );

      if (filtersParam) {
        url.searchParams.append('filter', filtersParam);
      }
      setQueryUrl(url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${application?.serverAccessToken}`,
          'X-Cord-Source': 'console',
        },
      });

      const res = await response.json();
      const resAllThreads = res as ServerListThreads;
      setThreadsCount(resAllThreads.pagination.total);

      return {
        data: resAllThreads.threads,
        totalItems: resAllThreads.pagination.total,
        token: resAllThreads.pagination.token,
      };
    },
    [application?.serverAccessToken, filtersParam],
  );

  const queryKey = useMemo(
    () => [
      'console-threads',
      `application-${application?.id}`,
      `filter-${filtersParam}`,
    ],
    [application?.id, filtersParam],
  );

  // The functionality to refetch the data is caused by react-query whenever
  // queryKey gets updated. In out case we remove the consolePaginationTable which
  // contains all the logic for react-query when the threadCount is 0 (which happens
  // when a user inputs a filter matching no threads). This leads to a state where
  // when we update the filters to one that can find something, we no longer refetch
  // as consolePaginationTable is no longer on the page

  // we overcome this by setting threadsCount to null whenever the queryKey changes
  // which will display the consoleTable/do an appropriate refetch
  useEffect(() => {
    setThreadsCount(null);
  }, [queryKey]);

  if (!application) {
    return <SpinnerCover />;
  }

  return (
    <Main header={<Header text="Threads" />}>
      <Helmet>
        <title>Threads</title>
      </Helmet>
      <ApiInformationBlock
        url={queryUrl?.toString()}
        docsLink="/rest-apis/threads"
        cliCommand="cord thread"
      />
      <Typography variant="body1">
        <strong>
          {threadsCount} {threadsCount === 1 ? 'thread' : 'threads'}
        </strong>{' '}
        in {application.name}
      </Typography>

      <Filter
        filterBy={{
          location: true,
          metadata: true,
        }}
        location={locationFilter}
        setLocation={setLocationFilter}
        metadata={metadataFilter}
        setMetadata={setMetadataFilter}
      />

      {threadsCount === null || threadsCount > 0 ? (
        <>
          <ConsoleDataTableWithPagination
            queryKey={queryKey}
            headers={HEADERS}
            getData={fetchThreads}
            renderRow={(props) => (
              <Row
                key={props.row.id}
                {...props}
                onDeletionClicked={showDeletionModal}
                baseUrl={baseUrl}
              />
            )}
          />
          <DeletionConfirmationModal
            header={'Delete Thread?'}
            body={
              <>
                <p>
                  Deleting a thread will delete the thread{' '}
                  <strong>permanently</strong>, including all messages
                  associated with it. This can not be undone. Press Delete to
                  confirm or Cancel to back out.
                </p>
              </>
            }
            visible={deletionModalVisible}
            onCancel={hideDeletionModal}
            onDelete={() => void confirmDeletion()}
          />
        </>
      ) : (
        <EmptyState
          path={'threads'}
          location={application.name}
          isFilteredData={filtersParam !== undefined}
        />
      )}
    </Main>
  );
}

function Row({
  row: rowUntyped,
  refetch,
  onDeletionClicked,
  baseUrl,
}: RenderRowParams<CoreThreadData> & {
  onDeletionClicked: (threadID: string, refetch: () => Promise<void>) => void;
  baseUrl: string;
}) {
  const classes = useStyles();

  const row = rowUntyped as unknown as ThreadData;
  const moreOptions = [
    {
      text: 'Delete',
      callback: () => {
        onDeletionClicked(row.id, refetch);
      },
    },
  ];
  const { org } = useGetApplicationOrg(row.groupID);

  return (
    <TableRow key={row.id}>
      <TableCell className={classes.noWrap}>
        <Link to={`${baseUrl}/${row.id}`} className={classes.link}>
          <Typography variant="monospaceTableCell">{row.id}</Typography>
        </Link>
      </TableCell>
      <TableCell className={classes.noWrap}>
        {org?.name && <Typography variant="body2">{org?.name}</Typography>}
        <Typography variant="monospaceTableCell">{row.groupID}</Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">{row.total}</Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">{row.userMessages}</Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">
          {row.actionMessages}
        </Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">
          {row.deletedMessages}
        </Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">
          {String(row.resolved)}
        </Typography>
      </TableCell>
      <TimestampCell time={row.resolvedTimestamp} />
      <JSONCell json={row.participants} />
      <JSONCell json={row.subscribers} />
      <JSONCell json={row.repliers} />
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">{row.name}</Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">{row.url}</Typography>
      </TableCell>
      <JSONCell json={row.location} />
      <JSONCell json={row.metadata} />
      <JSONCell json={row.typing} />
      <MoreCell options={moreOptions} />
    </TableRow>
  );
}
