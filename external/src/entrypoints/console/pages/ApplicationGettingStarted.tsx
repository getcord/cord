import React from 'react';
import { createUseStyles } from 'react-jss';
import { Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
} from '@heroicons/react/20/solid';

import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import { TaskCard } from 'external/src/entrypoints/console/components/TaskCard.tsx';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import { ComponentTask } from 'external/src/entrypoints/console/components/GettingStartedComponentTask.tsx';
import {
  ConsoleApplicationRoutes,
  getBaseApplicationURL,
} from 'external/src/entrypoints/console/routes.ts';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${Sizes.XLARGE}px`,
  },
});

export default function ApplicationGettingStarted() {
  const isLandingPageEnabledInConsole = useFeatureFlag(
    FeatureFlags.SHOW_CONSOLE_LANDING_PAGE,
  );
  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const navigate = useNavigate();
  const classes = useStyles();
  if (!application || !isLandingPageEnabledInConsole) {
    navigate('/projects', { replace: true });
    return <SpinnerCover />;
  }

  return (
    <Main header={<Header text={`Getting started with ${application.name}`} />}>
      <section className={classes.container}>
        <TaskCard
          taskCompleted={!!application?.setupInfo?.firstUser}
          header={`Add a User to ${application.name}`}
          body={
            <Typography sx={{ color: Colors.GREY_DARK }}>
              You can create a User using the{' '}
              <Link
                href={`${DOCS_ORIGIN}/get-started/integration-guide/cord-account#Install-the-CLI`}
                target="_blank"
              >
                Cord CLI
              </Link>{' '}
              <Link
                href={`${DOCS_ORIGIN}/get-started/integration-guide/cord-account#Install-the-CLI`}
                target="_blank"
              >
                <ArrowTopRightOnSquareIcon height={14} />
              </Link>
              , with the{' '}
              <Link href={`${DOCS_ORIGIN}/rest-apis/users`} target="_blank">
                REST APIs
              </Link>{' '}
              <Link href={`${DOCS_ORIGIN}/rest-apis/users`} target="_blank">
                <ArrowTopRightOnSquareIcon height={14} />
              </Link>
              , or in the{' '}
              <Link
                href={`${getBaseApplicationURL(application.id)}/${
                  ConsoleApplicationRoutes.APPLICATION_USERS
                }`}
              >
                Users page
              </Link>
              {'. '}
            </Typography>
          }
          footer={
            <Typography sx={{ color: Colors.GREY_DARK }}>
              Learn more about{' '}
              <Link
                href={`${DOCS_ORIGIN}/reference/permissions#Users`}
                target="_blank"
              >
                Users
              </Link>{' '}
              <Link
                href={`${DOCS_ORIGIN}/reference/permissions#Users`}
                target="_blank"
              >
                <ArrowTopRightOnSquareIcon height={14} />
              </Link>
            </Typography>
          }
          CTA={
            <>
              <Link href={`/projects/${application.id}/users`}>
                <strong>
                  View Users in{' '}
                  {application?.name ? application?.name : 'your project'}
                </strong>
              </Link>{' '}
              <Link href={`/projects/${application.id}/users`}>
                <ArrowRightIcon height={16} />
              </Link>
            </>
          }
        />

        <TaskCard
          taskCompleted={!!application?.setupInfo?.firstOrg}
          header={`Add a Group to ${
            application?.name ? application.name : 'your project'
          }`}
          body={
            <Typography sx={{ color: Colors.GREY_DARK }}>
              Users belong to Groups, and can only see messages from the Groups
              they&apos;re in. You can create a Group containing the User you
              created, using the{' '}
              <Link
                href={`${DOCS_ORIGIN}/get-started/integration-guide/create-user#Create-a-group`}
                target="_blank"
              >
                Cord CLI
              </Link>{' '}
              <Link
                href={`${DOCS_ORIGIN}/get-started/integration-guide/create-user#Create-a-group`}
                target="_blank"
              >
                <ArrowTopRightOnSquareIcon height={14} />
              </Link>
              , with the{' '}
              <Link
                href={`${DOCS_ORIGIN}/rest-apis/groups#Create-or-update-a-group`}
                target="_blank"
              >
                REST APIs
              </Link>{' '}
              <Link
                href={`${DOCS_ORIGIN}/rest-apis/groups#Create-or-update-a-group`}
                target="_blank"
              >
                <ArrowTopRightOnSquareIcon height={14} />
              </Link>
              , or in the{' '}
              <Link
                href={`${getBaseApplicationURL(application.id)}/${
                  ConsoleApplicationRoutes.APPLICATION_ORGS
                }`}
              >
                Groups page
              </Link>
              {'. '}
            </Typography>
          }
          footer={
            <Typography sx={{ color: Colors.GREY_DARK }}>
              Learn more about{' '}
              <Link
                href={`${DOCS_ORIGIN}/reference/permissions#Groups`}
                target="_blank"
              >
                Groups
              </Link>{' '}
              <Link
                href={`${DOCS_ORIGIN}/reference/permissions#Groups`}
                target="_blank"
              >
                <ArrowTopRightOnSquareIcon height={14} />
              </Link>
            </Typography>
          }
          CTA={
            <>
              <Link href={`/projects/${application.id}/groups`}>
                <strong>
                  View Groups in{' '}
                  {application?.name ? application?.name : 'your project'}
                </strong>
              </Link>{' '}
              <Link href={`/projects/${application.id}/groups`}>
                <ArrowRightIcon height={16} />
              </Link>
            </>
          }
        />
        <ComponentTask />
      </section>
    </Main>
  );
}
