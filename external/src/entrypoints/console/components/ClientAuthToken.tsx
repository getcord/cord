import { useState, useCallback } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import * as jose from 'jose';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import SecretBox from 'external/src/entrypoints/console/components/SecretBox.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { API_ORIGIN } from 'common/const/Urls.ts';
import type { ConsoleApplicationFragment } from 'external/src/entrypoints/console/graphql/operations.ts';
import { BoxRow } from 'external/src/entrypoints/console/components/BoxRow.tsx';

const useStyles = createUseStyles({
  row: {
    display: 'grid',
    gridTemplateColumns: '75% 25%',
    gap: Sizes.MEDIUM,
    alignItems: 'end',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.MEDIUM,
  },
  header: { fontWeight: 500 },
  errorMessageContainer: {
    height: Sizes.LARGE,
    width: '100%',
  },
  label: { margin: 0, padding: 0 },
  button: {
    height: '55px',
  },
});

export async function generateClientAuthToken({
  application,
  userID,
}: {
  application: ConsoleApplicationFragment | null;
  userID: string;
}) {
  if (!application || userID === '') {
    return;
  }

  const secret = new TextEncoder().encode(application.sharedSecret);
  const alg = 'HS512';

  const jwt = await new jose.SignJWT({
    app_id: application.id,
    user_id: userID,
  })
    .setProtectedHeader({ alg, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);

  return jwt;
}

export function GettingStartedClientAuthToken({
  setGroupID,
  setCreatedAuthToken,
}: {
  setGroupID: (id: string) => void;
  setCreatedAuthToken: (token: string | undefined) => void;
}) {
  const classes = useStyles();

  const { application, refetch: refetchApplication } =
    useContextThrowingIfNoProvider(ConsoleApplicationContext);
  const firstUserID = application?.setupInfo?.firstUser?.externalID;
  const firstOrgID = application?.setupInfo?.firstOrg?.externalID;

  // Prefill the UI with an existing user ID (the first user created in the app)
  const [userID, setUserID] = useState(firstUserID ?? '');
  const [errorMessage, setErrorMessage] = useState('');

  const onFillTokenClick = useCallback(async () => {
    const createdGroupID = firstOrgID ?? 'my-first-group';
    try {
      if (!firstOrgID) {
        // creating the org first means we can just update the user in the next
        // step and add it to a group, instead of creating a group with members
        const orgResponse = await fetch(
          `${API_ORIGIN}/v1/groups/${createdGroupID}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${application!.serverAccessToken}`,
              'X-Cord-Source': 'console',
            },
            body: JSON.stringify({
              name: createdGroupID,
            }),
          },
        );

        if (!orgResponse.ok) {
          throw new Error('Something went wrong, please try again.');
        }
      }
      setGroupID(createdGroupID);

      const createdUserID = userID.trim();
      // if the user exists, then we don't need to add a name
      const userExistsResponse = await fetch(
        `${API_ORIGIN}/v1/users/${createdUserID}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${application!.serverAccessToken}`,
            'X-Cord-Source': 'console',
          },
        },
      );

      // TODO(k): check if member exists in org so we don't have to do this
      // unnecessarily
      const userExists = userExistsResponse.status === 200;
      // Since we will either create or update a user here, we can just use what
      // has been passed down from the UI. Then create/update the user and add
      // it to the group we have on record (it could be the first group created in the app
      // or a new one we just created if no group exists)
      const userResponse = await fetch(
        `${API_ORIGIN}/v1/users/${createdUserID}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${application!.serverAccessToken}`,
            'X-Cord-Source': 'console',
          },
          body: JSON.stringify({
            addGroups: [createdGroupID],
            name: !userExists ? createdUserID : undefined,
          }),
        },
      );

      if (!userResponse.ok) {
        throw new Error(
          'Something went wrong updating the user, please try again.',
        );
      }

      const token = await generateClientAuthToken({
        application,
        userID: createdUserID,
      });
      setCreatedAuthToken(token);
      // this way, we can update those checks if they hadn't created a group or user before
      await refetchApplication();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          'Something went wrong generating the client auth token.',
        );
      }
    }
  }, [
    application,
    userID,
    firstOrgID,
    setGroupID,
    setCreatedAuthToken,
    refetchApplication,
  ]);

  return (
    <>
      <div className={classes.row}>
        <div>
          <label className={classes.label}>
            <Typography variant="caption">User ID</Typography>
          </label>
          <TextField
            type="text"
            placeholder="User ID"
            value={userID}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUserID(e.target.value)
            }
            fullWidth
            error={Boolean(errorMessage)}
            sx={{ mt: `${Sizes.MEDIUM}px` }}
          />
        </div>

        <Button
          variant="contained"
          onClick={() => void onFillTokenClick()}
          disabled={userID.length === 0}
          className={classes.button}
        >
          Fill client auth token
        </Button>
      </div>
      {errorMessage && (
        <Typography
          variant="body2"
          color="error"
          marginBottom={`${Sizes.MEDIUM}px`}
        >
          <ExclamationCircleIcon height={20} /> <span>{errorMessage}</span>
        </Typography>
      )}
    </>
  );
}

export function ConfigurationClientAuthToken() {
  const classes = useStyles();

  const [userID, setUserID] = useState('');
  const [clientJWT, setClientJWT] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const onGenerateTokenClick = useCallback(() => {
    setErrorMessage('');

    // Check if the user exists
    void fetch(`${API_ORIGIN}/v1/users/${userID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${application!.serverAccessToken}`,
        'X-Cord-Source': 'console',
      },
    }).then(async (response) => {
      if (response.ok) {
        const token = await generateClientAuthToken({ application, userID });
        setClientJWT(token ?? null);
        return;
      }
      // This means it's errored somehow
      const resultString = await response.text();
      const result = JSON.parse(resultString);
      if ('error' in result && result.error === 'user_not_found') {
        setErrorMessage(
          'User does not exist, you can create a user in the Users section.',
        );
      } else {
        setErrorMessage(
          'Something went wrong with generating client auth token.',
        );
      }
    });
  }, [application, userID]);

  return (
    <>
      <BoxRow label="User ID">
        <label className={classes.header}></label>
        <TextField
          type="text"
          placeholder="User ID"
          value={userID}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUserID(e.target.value)
          }
          fullWidth
          error={Boolean(errorMessage)}
        />
        {errorMessage && (
          <Typography
            variant="body2"
            color="error"
            marginTop={`${Sizes.MEDIUM}px`}
          >
            <ExclamationCircleIcon height={20} /> <span>{errorMessage}</span>
          </Typography>
        )}
      </BoxRow>

      <BoxRow label="">
        <Button
          variant="contained"
          onClick={onGenerateTokenClick}
          disabled={userID.length === 0}
        >
          Create client auth token
        </Button>
      </BoxRow>

      {clientJWT ? (
        <BoxRow label="Client auth token">
          <SecretBox text={clientJWT} canBeCopiedToClipboard hiddenOnRender />
        </BoxRow>
      ) : undefined}
    </>
  );
}
