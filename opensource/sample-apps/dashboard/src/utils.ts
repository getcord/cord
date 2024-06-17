import cx from 'classnames';
import type { ClientCreateMessage, ThreadID } from '@cord-sdk/types';
import { useEffect, useState } from 'react';

const CORD_TOKEN_LOCALSTORAGE_KEY = 'cord_token';
const CORD_SAMPLE_TOKEN_ENDPOINT = 'https://api.cord.com/sample-token';

const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = ONE_MINUTE_MS * 60 * 24;
const SEVEN_DAYS_MS = ONE_DAY_MS * 7;

function canUseLocalStorage() {
  try {
    typeof window.localStorage;
    return true;
  } catch {
    return false;
  }
}

export function useCordSampleToken_DEMO_ONLY_NOT_FOR_PRODUCTION() {
  const [{ value: cordAuthToken, hasExpired }, setCordAuthToken] = useState<{
    value: string | null;
    hasExpired: boolean;
  }>(
    canUseLocalStorage()
      ? () => getLocalStorageItemWithExpiry(CORD_TOKEN_LOCALSTORAGE_KEY)
      : { value: null, hasExpired: true },
  );

  useEffect(() => {
    if (!cordAuthToken || hasExpired) {
      void fetchCordSampleToken().then((token) => {
        if (token) {
          setCordAuthToken({ value: token, hasExpired: false });

          if (canUseLocalStorage()) {
            localStorage.setItem(
              CORD_TOKEN_LOCALSTORAGE_KEY,
              withExpiry(
                token,
                // Sample token expires after 7 days
                getTimeInXMillisecondsFromNow(SEVEN_DAYS_MS),
              ),
            );
          } else {
            console.warn(
              `Cannot save Cord token in the localStorage. If you refresh the page, you will lose all your messages.`,
            );
          }
        }
      });
    }
  }, [cordAuthToken, hasExpired]);

  return cordAuthToken;
}

async function fetchCordSampleToken(): Promise<string | null> {
  try {
    const response = await fetch(CORD_SAMPLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extended: 'true' }),
    });

    if (response.status !== 200) {
      throw new Error('Failed to fetch Cord sample token');
    }

    const { client_auth_token } = await response.json();
    return client_auth_token;
  } catch (e) {
    console.error(e);
    return null;
  }
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

// We do not recommend adding a quote before the first message this
// way. That is, because when editing a message, a user can modify
// this quote. For now, however, this is the best approach.
// In the near future we will provide a better alternative to achieve
// this.
export function handleBeforeMessageCreate(
  message: ClientCreateMessage,
  context: {
    threadID: ThreadID;
    firstMessage: boolean;
  },
) {
  const threadMetadata = message.createThread?.metadata;
  if (!context.firstMessage || !threadMetadata) {
    return message;
  }

  let text: string;
  let title: string;
  if (threadMetadata.type === 'grid') {
    title = threadMetadata.headerName.toString();
    const year = threadMetadata.rowId;
    text = `${title}: ${year} Revenue`;
  } else {
    title = threadMetadata.seriesName.toString();
    const year = threadMetadata.x;
    text = `${title}: ${year} Market cap`;
  }

  const quote = {
    type: 'p',
    children: [
      {
        text,
        class: cx('metadata-quote', title.toLowerCase()),
      },
    ],
  };
  message.content.splice(0, 0, quote);

  return message;
}
