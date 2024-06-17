import { useState, useCallback, useMemo, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { createUseStyles } from 'react-jss';
import { Helmet } from 'react-helmet';
import {
  Button,
  TablePagination,
  Typography,
  TableBody,
  TableHead,
  TableContainer,
  TableRow,
  TableCell,
  Table,
  TableFooter,
} from '@mui/material';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Colors } from 'common/const/Colors.ts';
import {
  ConsoleApplicationRoutes,
  getBaseApplicationURL,
} from 'external/src/entrypoints/console/routes.ts';
import type { ApplicationsQueryResult } from 'external/src/entrypoints/console/graphql/operations.ts';
import {
  useApplicationsQuery,
  useConsoleUserQuery,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { Spinner } from 'external/src/components/ui/Spinner.tsx';
import { pluralize } from '@cord-sdk/react/common/util.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Styles } from 'common/const/Styles.ts';
import { withLoadingUntilConnected } from 'external/src/entrypoints/console/components/ProtectedRoute.tsx';
import {
  ApplicationCreationModal,
  CreateAppForm,
} from 'external/src/entrypoints/console/components/ApplicationCreationModal.tsx';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import Modal from 'external/src/entrypoints/console/ui/Modal.tsx';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import { getPrettyCustomerName } from 'external/src/entrypoints/console/utils.ts';
import { ApiInformationBlock } from 'external/src/entrypoints/console/components/ApiInformationBlock.tsx';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { CustomInputGroup } from 'external/src/entrypoints/console/components/Filter/CustomInputGroup.tsx';

const ROWS_PER_PAGE = 10;

const useStyles = createUseStyles({
  applicationsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${Sizes.XLARGE}px`,
    width: '100%',
  },
  tableTitle: {
    marginBlockEnd: Sizes.XLARGE,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  appCount: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  helpOutlineIcon: {
    cursor: 'pointer',
    fontSize: Sizes.LARGE,
    margin: Sizes.SMALL,
  },
  extraLinks: {
    display: 'flex',
    gap: Sizes.SMALL,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  createApplicationCard: {
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
    boxShadow: Styles.DEFAULT_SHADOW,
    margin: `${Sizes.XLARGE}px auto`,
    width: '50%',
  },
  sectionTop: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    color: Colors.GREY_X_DARK,
    marginBottom: Sizes.LARGE,
  },
  viewCredentialsButton: {
    color: Colors.WHITE,
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
    marginLeft: '20px',
    backgroundColor: Colors.BRAND_PURPLE_DARK,
    height: 'fit-content',
    '&:hover ': {
      backgroundColor: Colors.BRAND_PURPLE_LIGHT,
      color: Colors.BRAND_PURPLE_DARK,
      border: `${Sizes.DEFAULT_BORDER_WIDTH}px solid ${Colors.BRAND_PURPLE_DARK}`,
    },
  },
  headerButtons: {
    height: '100%',
  },
  table: { width: '100%' },
  emptyAppsSvg: {
    maxWidth: '192px',
    color: Colors.BRAND_PURPLE_DARK,
    marginBlockEnd: Sizes.LARGE,
  },
  emptyAppsBox: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  emptyAppsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: Sizes.MEDIUM,
  },
  tableNameContainer: {
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  tableNameArrowIcon: {
    minWidth: '18px',
  },
  createProjectButton: {
    width: 'fit-content',
    alignSelf: 'center',
  },
  customInput: {
    //TODO: Consider any updates for layout improvements?
    width: '378px',
  },
});

export default function Applications() {
  const isLandingPageEnabledInConsole = useFeatureFlag(
    FeatureFlags.SHOW_CONSOLE_LANDING_PAGE,
  );
  const classes = useStyles();
  const navigate = useNavigate();
  const [appCreationModalOpen, setAppCreationModalOpen] = useState(false);
  const [createFirstProjectModalOpen, setCreateFirstProjectModalOpen] =
    useState(false);

  const onCreateButtonClick = useCallback(() => {
    setAppCreationModalOpen(true);
  }, []);
  const createAppButton = (
    <Button
      variant="contained"
      onClick={onCreateButtonClick}
      className={classes.createProjectButton}
    >
      Create project
    </Button>
  );

  const onSaveApplication = useCallback(
    (createdApplicationID: string) => {
      navigate(getBaseApplicationURL(createdApplicationID));
    },
    [navigate],
  );

  const onSaveFirstCreatedApplication = useCallback(
    (createdApplicationID: string) => {
      navigate(
        `${getBaseApplicationURL(createdApplicationID)}/${
          ConsoleApplicationRoutes.APPLICATION_GETTING_STARTED
        }`,
      );
    },
    [navigate],
  );

  const { data: applicationsData, loading: applicationsLoading } =
    useApplicationsQuery();

  useEffect(() => {
    const hasAnApplication = !!(
      applicationsData?.applications && applicationsData.applications.length > 0
    );
    setCreateFirstProjectModalOpen(!hasAnApplication);
  }, [applicationsData]);

  return (
    <Main header={<Header text="Projects" />}>
      <Helmet>
        <title>Projects</title>
      </Helmet>
      <div className={classes.applicationsContainer}>
        <ApplicationsOverview
          createAppButton={createAppButton}
          applicationsData={applicationsData}
          applicationsLoading={applicationsLoading}
        />
      </div>
      <ApplicationCreationModal
        isShown={appCreationModalOpen}
        onClose={() => {
          setAppCreationModalOpen(false);
        }}
        onSave={onSaveApplication}
      />
      {isLandingPageEnabledInConsole && !applicationsLoading ? (
        <Modal show={createFirstProjectModalOpen} backdrop={'static'}>
          <Modal.Header>
            <strong>Create your first project</strong>
          </Modal.Header>
          <CreateAppForm
            onSuccess={onSaveFirstCreatedApplication}
            bodyText={
              <>
                <Typography variant="body2">
                  Thanks for signing up! To use Cord in your product, you must
                  first create a project. This is where all your users, threads,
                  messages, and API keys will live.
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  Don&apos;t worry, you will be able to update or delete this
                  project once it&apos;s created.
                </Typography>
              </>
            }
          />
        </Modal>
      ) : null}
    </Main>
  );
}

const useClickableRowStyles = createUseStyles({
  clickRow: {
    '&:hover': {
      textDecoration: 'underline',
      cursor: 'pointer',
    },
  },
});

const ApplicationsOverview = withLoadingUntilConnected(
  function ApplicationsOverview({
    createAppButton,
    applicationsData,
    applicationsLoading,
  }: {
    createAppButton: React.ReactNode;
    applicationsData?: ApplicationsQueryResult;
    applicationsLoading: boolean;
  }) {
    const classes = useStyles();
    const navigate = useNavigate();

    const { data: userData, loading: userLoading } = useConsoleUserQuery();
    const [page, setPage] = useState(0);

    const [searchquery, setsearchquery] = useState('');
    const handleSearchChange = (query: string) => {
      setsearchquery(query);
    };

    const showSpinner =
      applicationsLoading || !applicationsData?.applications || userLoading;

    const filteredRows = useMemo(() => {
      if (!applicationsData || !applicationsData.applications) {
        return [];
      }
      setPage(0);
      if (searchquery === '') {
        return applicationsData.applications;
      }
      return applicationsData.applications.filter(
        (app) =>
          app.application.name
            .toLocaleLowerCase()
            .includes(searchquery.toLocaleLowerCase()) ||
          app.application.id
            .toLocaleLowerCase()
            .includes(searchquery.toLocaleLowerCase()),
      );
    }, [applicationsData, searchquery]);

    const visibleRows = useMemo(() => {
      if (showSpinner || !filteredRows) {
        return [];
      }
      return filteredRows.slice(
        page * ROWS_PER_PAGE,
        page * ROWS_PER_PAGE + ROWS_PER_PAGE,
      );
    }, [page, showSpinner, filteredRows]);

    if (showSpinner) {
      return <Spinner />;
    }

    return (
      <>
        <section className={classes.tableTitle}>
          <ApiInformationBlock
            url="https://api.cord.com/v1/projects"
            docsLink="/rest-apis/projects"
            cliCommand="cord project"
          />
          <div className={classes.appCount}>
            <Typography variant="body1">
              <strong>
                {pluralize(
                  applicationsData.applications.length,
                  'project',
                  'projects',
                )}
              </strong>{' '}
              for {getPrettyCustomerName(userData?.consoleUser?.customer?.name)}
            </Typography>
            <CustomInputGroup
              label={'Filter by application name or ID'}
              id={'searchfilter'}
              placeholder={`e.g. My Application`}
              value={searchquery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleSearchChange(e.target.value || '')
              }
              className={classes.customInput}
            />
          </div>
        </section>
        {applicationsData.applications.length > 0 && (
          <TableContainer className={classes.table}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Users</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Groups</strong>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow
                    key={row.application.id}
                    component={ClickableRow}
                    to={`${getBaseApplicationURL(row.application.id)}`}
                  >
                    <TableCell>
                      <div className={classes.tableNameContainer}>
                        {row.application.name}{' '}
                        <ArrowRightIcon
                          className={classes.tableNameArrowIcon}
                          height={18}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography variant="monospaceTableCell">
                        {row.application.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.userCount}</TableCell>
                    <TableCell>{row.orgCount}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        onClick={(event) => {
                          navigate(
                            `${getBaseApplicationURL(row.application.id)}`,
                          );
                          event.stopPropagation();
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    count={filteredRows.length}
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
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
        {createAppButton}
      </>
    );
  },
);

function ClickableRow(props: React.PropsWithChildren<{ to: string }>) {
  const classes = useClickableRowStyles();
  const navigate = useNavigate();
  const navigateCallback = useCallback(
    () => navigate(props.to),
    [navigate, props.to],
  );
  return (
    <tr onClick={navigateCallback} className={classes.clickRow}>
      {props.children}
    </tr>
  );
}
