import fetch from 'node-fetch';
import {
  getApplicationManagementAuthToken,
  getServerAuthToken,
} from '@cord-sdk/server';
import { getEnvVariables } from 'src/utils';

const DEFAULT_CORD_API_URL = 'https://api.cord.com/v1';

export async function fetchCordRESTApi<T>(
  endpoint: string,
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET',
  body?: string | FormData,
): Promise<T> {
  const env = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });
  if (!env || !env.CORD_PROJECT_ID || !env.CORD_PROJECT_SECRET) {
    throw new Error('Please initialize cord first. Run cord init.');
  }

  const api_url = env.CORD_API_URL ?? DEFAULT_CORD_API_URL;

  const serverAuthToken = getServerAuthToken(
    env.CORD_PROJECT_ID,
    env.CORD_PROJECT_SECRET,
  );
  const headers = {
    Authorization: `Bearer ${serverAuthToken}`,
    ...(typeof body === 'string' ? { 'Content-Type': 'application/json' } : {}),
    'X-Cord-Source': 'cli',
  };
  const response = await fetch(`${api_url}/${endpoint}`, {
    method,
    body,
    headers,
  });

  if (response.ok) {
    return response.json() as T;
  } else {
    const responseText = await response.text();
    throw new Error(
      `Error making Cord API call: ${response.status} ${response.statusText} ${responseText}`,
    );
  }
}

export async function fetchCordManagementApi<T>(
  endpoint: string,
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET',
  body?: string,
): Promise<T> {
  const env = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });
  if (!env) {
    throw new Error('Please initialize cord first. Run "cord init".');
  }
  if (!env.CORD_CUSTOMER_ID || !env.CORD_CUSTOMER_SECRET) {
    throw new Error(
      'Missing CORD_CUSTOMER_ID or CORD_CUSTOMER_SECRET, please run "cord init" and add these values.',
    );
  }

  const api_url = env.CORD_API_URL ?? DEFAULT_CORD_API_URL;

  const applicationManagementToken = getApplicationManagementAuthToken(
    env.CORD_CUSTOMER_ID,
    env.CORD_CUSTOMER_SECRET,
  );

  const response = await fetch(`${api_url}/${endpoint}`, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${applicationManagementToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json() as T;
  } else {
    const responseText = await response.text();
    throw new Error(
      `Error making Cord API call: ${response.status} ${response.statusText} ${responseText}`,
    );
  }
}
