import { useEffect, useState } from 'react';

const CORD_TOKEN_LOCALSTORAGE_KEY = 'cord_token';
const CORD_APP_ID_LOCALSTORAGE_KEY = 'cord_app_id';
const CORD_DEMO_ROOMS_LOCALSTORAGE_KEY = 'cord_demo_rooms';
const CORD_DEMO_APPS_TOKEN_ENDPOINT = `https://${process.env.API_SERVER_HOST}/demo-apps-token`;

const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = ONE_MINUTE_MS * 60 * 24;

export function useCordDemoRooms() {
  // We wipe the demo apps after 24 hours of inactivity.
  // The client will prevent tabs in the background from being
  // open for more than 24 hours

  let selfDestructTimer: NodeJS.Timeout | null = null;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (selfDestructTimer) {
        clearTimeout(selfDestructTimer);
      }
    } else {
      selfDestructTimer = setTimeout(
        () => document.location.reload(),
        ONE_DAY_MS,
      );
    }
  });

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const forceCreateNewRoom = urlParams.get('new');

    if (forceCreateNewRoom === 'true') {
      localStorage.removeItem(CORD_TOKEN_LOCALSTORAGE_KEY);
      localStorage.removeItem(CORD_APP_ID_LOCALSTORAGE_KEY);
      localStorage.setItem(CORD_DEMO_ROOMS_LOCALSTORAGE_KEY, 'true');
      window.location.assign(
        document.location.origin + document.location.pathname,
      );
    } else {
      const currentRoom = urlParams.get('room');
      const { value: previousRoom, hasExpired: previousRoomExpired } =
        getLocalStorageItemWithExpiry(CORD_APP_ID_LOCALSTORAGE_KEY);
      const previousRoomStillValid = !previousRoomExpired && previousRoom;
      const roomsEnabled =
        localStorage.getItem(CORD_DEMO_ROOMS_LOCALSTORAGE_KEY) === 'true';

      if (!currentRoom && previousRoomStillValid && roomsEnabled) {
        const newURL = new URL(window.location.href);
        newURL.searchParams.set('room', previousRoom);
        window.location.assign(newURL);
      } else {
        const userVisitingNewRoom =
          currentRoom !== null &&
          previousRoom !== null &&
          currentRoom !== previousRoom;

        if (userVisitingNewRoom) {
          localStorage.setItem(CORD_DEMO_ROOMS_LOCALSTORAGE_KEY, 'true');
          // The user was logged into another room. Clear the previous session
          // so if they get sent a new room link they can join it.
          localStorage.removeItem(CORD_TOKEN_LOCALSTORAGE_KEY);
          localStorage.removeItem(CORD_APP_ID_LOCALSTORAGE_KEY);
        }
      }
    }
  } catch {
    // Do nothing to prevent exposing errors in the client.
  }
}

export function useCordDemoAppsToken() {
  const [
    { value: cordAuthToken, hasExpired: hasAuthTokenExpired },
    setCordAuthToken,
  ] = useState<{ value: string | null; hasExpired: boolean }>(() =>
    getLocalStorageItemWithExpiry(CORD_TOKEN_LOCALSTORAGE_KEY),
  );

  const [{ value: appID }, setCordAppID] = useState<{
    value: string | null;
    hasExpired: boolean;
  }>(() => getLocalStorageItemWithExpiry(CORD_APP_ID_LOCALSTORAGE_KEY));

  useEffect(() => {
    if (!cordAuthToken || hasAuthTokenExpired) {
      const urlParams = new URLSearchParams(window.location.search);
      const currentRoom = urlParams.get('room');

      const existingAppID = appID ?? currentRoom;

      const roomsEnabled =
        localStorage.getItem(CORD_DEMO_ROOMS_LOCALSTORAGE_KEY) === 'true';

      void fetchCordDemoAppsToken(cordAuthToken, existingAppID)
        .then(({ client_auth_token, app_id }) => {
          if (client_auth_token && app_id) {
            localStorage.setItem(
              CORD_TOKEN_LOCALSTORAGE_KEY,
              withExpiry(
                client_auth_token,
                getTimeInXMillisecondsFromNow(ONE_MINUTE_MS),
              ),
            );

            localStorage.setItem(
              CORD_APP_ID_LOCALSTORAGE_KEY,
              withExpiry(app_id, getTimeInXMillisecondsFromNow(ONE_DAY_MS)),
            );
            setCordAuthToken({ value: client_auth_token, hasExpired: false });
            setCordAppID({ value: app_id, hasExpired: false });

            // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            const urlParams = new URLSearchParams(window.location.search);
            // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            const currentRoom = urlParams.get('room');

            if (!currentRoom && roomsEnabled) {
              const newURL = new URL(window.location.href);
              newURL.searchParams.set('room', app_id);
              window.location.replace(newURL);
            }
          }
        })
        .catch((e) => console.error('Token fetch failed', e));
    }
  }, [appID, cordAuthToken, hasAuthTokenExpired]);

  return cordAuthToken;
}

async function fetchCordDemoAppsToken(
  cordAuthToken: string | null = null,
  appID: string | null = null,
): Promise<{
  client_auth_token: string | null;
  app_id: string | null;
}> {
  try {
    const response = await fetch(CORD_DEMO_APPS_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: appID ?? undefined, // appID may be passed for room sharing
        token: cordAuthToken ?? undefined, // used for persisting user
      }),
    }).then((res) =>
      res.ok
        ? res.json()
        : res.text().then((text) => {
            throw new Error(text);
          }),
    );

    const { client_auth_token, app_id } = response;
    return { client_auth_token, app_id };
  } catch (e) {
    console.error(e);
    return { client_auth_token: null, app_id: null };
  }
}

export function startRoomSession() {
  const { value: appID } = getLocalStorageItemWithExpiry(
    CORD_APP_ID_LOCALSTORAGE_KEY,
  );
  const urlParams = new URLSearchParams(window.location.search);
  const currentRoom = urlParams.get('room');

  if (currentRoom) {
    void navigator.clipboard.writeText(window.location.href);
    return;
  }

  localStorage.setItem(CORD_DEMO_ROOMS_LOCALSTORAGE_KEY, 'true');
  const newURL = new URL(window.location.href);
  newURL.searchParams.set('room', appID);
  void navigator.clipboard.writeText(newURL.href);
  window.history.replaceState(null, '', newURL);
}

function getLocalStorageItemWithExpiry(key: string) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return { value: null, hasExpired: true };
  }

  try {
    const item = JSON.parse(itemStr);
    const isValid = Boolean(item.expiry && item.value);
    if (!isValid) {
      localStorage.removeItem(key);
      return { value: null, hasExpired: true };
    }

    const hasExpired = new Date().getTime() > item.expiry;
    return { value: item.value, hasExpired };
  } catch {
    localStorage.removeItem(key);
    return { value: null, hasExpired: true };
  }
}

export function withExpiry(value: string, expiry: number) {
  const item = {
    value: value,
    expiry,
  };

  return JSON.stringify(item);
}

function getTimeInXMillisecondsFromNow(xMilliseconds: number) {
  return new Date(new Date().getTime() + xMilliseconds).getTime();
}

export function useIsWebsiteDemo(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const websiteDemo = (urlParams.get('website-demo') ?? 'false') !== 'false';

  useEffect(() => {
    if (websiteDemo) {
      document.documentElement.classList.add('website-demo');
    }
  }, [websiteDemo]);

  return websiteDemo;
}

/** This is a demo apps token that gets wiped periodically */
export function useWebsiteToken() {
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { client_auth_token } = await fetchCordDemoAppsToken();
      if (client_auth_token) {
        setAuthToken(client_auth_token);
      }
    })();
  }, []);

  return authToken;
}
