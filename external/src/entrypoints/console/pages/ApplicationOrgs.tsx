import { createUseStyles } from 'react-jss';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  CircularProgress,
  Link,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import EmptyGroupsSVG from 'external/src/static/EmptyGroups.svg';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import type {
  GetDataResponse,
  RenderRowParams,
} from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { ConsoleDataTableWithPagination } from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { API_ORIGIN } from 'common/const/Urls.ts';
import type { ServerListGroup } from '@cord-sdk/types';
import { Sizes } from 'common/const/Sizes.ts';
import { GroupCreationModal } from 'external/src/entrypoints/console/components/GroupCreationModal.tsx';
import { Colors } from 'common/const/Colors.ts';
import { ApiInformationBlock } from 'external/src/entrypoints/console/components/ApiInformationBlock.tsx';

const HEADERS = ['ID', 'Name', 'Status'];

const useStyles = createUseStyles({
  emptyOrgsSvg: {
    maxWidth: '192px',
    color: Colors.BRAND_PURPLE_DARK,
    marginBlockEnd: Sizes.LARGE,
  },
  emptyOrgsBox: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  emptyOrgsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: Sizes.MEDIUM,
  },
  tableTitle: {
    marginBlockEnd: Sizes.XLARGE,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  groupCount: {
    display: 'flex',
    marginBlockEnd: Sizes.XLARGE,
    justifyContent: 'space-between',
  },
});

function EmptyOrgs({ createOrgButton }: { createOrgButton: React.ReactNode }) {
  const classes = useStyles();

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  return (
    <Box className={classes.emptyOrgsBox}>
      <section className={classes.emptyOrgsContainer}>
        <EmptyGroupsSVG className={classes.emptyOrgsSvg} />
        <Typography variant="body2">
          <strong>{`There are no groups in ${
            application?.name ? `${application?.name}` : null
          }`}</strong>
        </Typography>
        {createOrgButton}
      </section>
    </Box>
  );
}

export function ApplicationOrgs() {
  const classes = useStyles();
  const [orgCount, setOrgCount] = useState<number | null>(null);
  const [groupCreationModalOpen, setGroupCreationModalOpen] = useState(false);

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const queryKey = useMemo(
    () => ['console-orgs', `application-${application?.id}`],
    [application],
  );

  const fetchGroups = useCallback(
    async (_: string | null): Promise<GetDataResponse<ServerListGroup>> => {
      const url = new URL(`${API_ORIGIN}/v1/groups/`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${application!.serverAccessToken}`,
          'X-Cord-Source': 'console',
        },
      });

      const typedResponse = (await response.json()) as ServerListGroup[];

      setOrgCount(typedResponse.length);

      return {
        data: typedResponse,
        totalItems: typedResponse.length,
        token: null,
      };
    },
    [application],
  );

  useEffect(() => {
    void fetchGroups(null);
  }, [fetchGroups]);

  const renderRow = useCallback(({ row }: RenderRowParams<ServerListGroup>) => {
    return (
      <TableRow key={row.id}>
        <TableCell sx={{ textWrap: 'nowrap' }}>
          <Typography variant="monospaceTableCell">{row.id}</Typography>
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>
          {row.status
            ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
            : 'Unknown'}
        </TableCell>
        <TableCell>
          <Link to={`${encodeURIComponent(row.id)}`} component={RouterLink}>
            View details and group members
          </Link>
        </TableCell>
      </TableRow>
    );
  }, []);

  const createGroupButton = (
    <Button
      variant="contained"
      onClick={() => {
        setGroupCreationModalOpen(true);
      }}
    >
      Create group
    </Button>
  );

  if (!application) {
    return <CircularProgress size="16px" />;
  }

  if (orgCount === null) {
    return <CircularProgress size="16px" />;
  }

  return (
    <Main header={<Header text={'Groups'} />}>
      {/* Todo: if there are no orgs this flickers because orgCount is initially
      null and we currently load the data from the table so need to render it to 
      set the value */}
      <section className={classes.tableTitle}>
        <ApiInformationBlock
          url="https://api.cord.com/v1/groups"
          docsLink="/rest-apis/groups"
          cliCommand="cord group"
        />
        {orgCount > 0 ? (
          <div className={classes.groupCount}>
            <Typography variant="body1">
              <strong>{orgCount} Groups</strong>
              {application ? ` for ${application?.name}` : null}
            </Typography>
            {createGroupButton}
          </div>
        ) : null}
      </section>
      {orgCount > 0 ? (
        <ConsoleDataTableWithPagination
          headers={HEADERS}
          getData={fetchGroups}
          renderRow={renderRow}
          queryKey={queryKey}
          key={orgCount}
        />
      ) : (
        <EmptyOrgs createOrgButton={createGroupButton} />
      )}
      <GroupCreationModal
        isShown={groupCreationModalOpen}
        onClose={() => {
          setGroupCreationModalOpen(false);
          // TODO: this is hacky - it makes the table rerender and so refetch data
          // because its key is the number of orgs, which this updates
          void fetchGroups(null);
        }}
      />
    </Main>
  );
}
