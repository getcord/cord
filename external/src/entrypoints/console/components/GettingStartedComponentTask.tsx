import { useState } from 'react';
import { Typography, Link } from '@mui/material';
import cx from 'classnames';
import { createUseStyles } from 'react-jss';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import CodeBlock from 'common/ui/codeBlock/CodeBlock.tsx';
import { ClientLanguageDisplayNames } from 'common/page_context/PreferenceContext.tsx';
import { GettingStartedClientAuthToken } from 'external/src/entrypoints/console/components/ClientAuthToken.tsx';

const useStyles = createUseStyles({
  box: {
    gap: `${Sizes.XLARGE}px`,
    padding: '40px',
    paddingLeft: '0',
    display: 'grid',
    gridTemplateColumns: '80px 1fr',
  },
  topContainer: {
    display: 'grid',
    gridTemplateColumns: '4fr 1fr',
    gap: `${Sizes.XLARGE}px`,
  },
  bottomContainer: {
    maxWidth: '900px',
  },
  clientAuthTokenSection: {
    paddingBottom: Sizes.LARGE,
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.SMALL,
  },
  successCheck: {
    color: Colors.GREY_LIGHT,
    paddingLeft: `${Sizes.XLARGE}px`,
    alignSelf: 'start',
  },

  taskCompleted: {
    color: Colors.GREEN,
  },
});

export function ComponentTask() {
  const classes = useStyles();
  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );
  const [groupID, setGroupID] = useState(
    application?.setupInfo?.firstOrg?.externalID,
  );
  const [clientAuthToken, setClientAuthToken] = useState<string | undefined>(
    undefined,
  );
  const taskCompleted = application?.setupInfo?.isComponentInitialized;

  return (
    <Box className={classes.box}>
      <CheckCircleIcon
        height={80}
        width={80}
        className={cx(classes.successCheck, {
          [classes.taskCompleted]: taskCompleted,
        })}
      />
      <section>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Add a Cord Thread to {application?.name ?? 'your project'}
        </Typography>
        <section className={classes.topContainer}>
          <section>
            <Typography variant="body1" sx={{ mb: 2, color: Colors.GREY_DARK }}>
              To add your first Cord component, you need a{' '}
              <Link
                href={`${DOCS_ORIGIN}/get-started/integration-guide/generate-an-auth-token`}
                target="_blank"
              >
                Client Auth Token
              </Link>
              , that tells Cord which User is logged in.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: Colors.GREY_DARK }}>
              You can generate one manually, below, that will be valid for two
              hours. Later, you can read the{' '}
              <Link
                href={`${DOCS_ORIGIN}/get-started/integration-guide/generate-an-auth-token#Tell-Cord-about-your-user-on-the-backend`}
                target="_blank"
              >
                Integration Guide
              </Link>{' '}
              to learn how to generate one in code.
            </Typography>
          </section>
        </section>

        <section className={classes.bottomContainer}>
          <div className={classes.clientAuthTokenSection}>
            {/* TODO: add some sort of boundary/separator*/}
            <GettingStartedClientAuthToken
              setGroupID={setGroupID}
              setCreatedAuthToken={setClientAuthToken}
            />
          </div>

          <Typography
            variant="body1"
            sx={{ mb: 2, mt: 2, color: Colors.GREY_DARK }}
          >
            Then, paste the code below, which will have the correct token in
            place of the text <code>CLIENT_AUTH_TOKEN</code>.
          </Typography>

          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `// To install Cord, run npm install @cord-sdk/react or yarn add @cord-sdk/react

import { CordProvider } from "@cord-sdk/react";
import { Thread } from "@cord-sdk/react";
  
export const App = () => (
  <CordProvider clientAuthToken="${clientAuthToken ?? 'CLIENT_AUTH_TOKEN'}">
  <Thread
    threadId={"my-first-thread"} 
    groupId={"${groupID ?? 'GROUP_ID'}"}
  />  
  </CordProvider>
);`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `// <!-- This goes in your <head> tag -->
// <script src="https://app.cord.com/sdk/v1/sdk.latest.js"></script>

window.CordSDK.init({
  client_auth_token: "${clientAuthToken ?? 'CLIENT_AUTH_TOKEN'}",
});

<cord-thread
  thread-id="my-first-thread" 
  group-id="${groupID ?? 'GROUP_ID'}"
}
></cord-thread>`,
              },
            ]}
          />
        </section>
      </section>
    </Box>
  );
}
