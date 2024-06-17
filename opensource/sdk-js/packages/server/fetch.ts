import { getServerAuthToken } from './authToken.js';

export type FetchOptions = {
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE';

  project_id: string;
  project_secret: string;
  api_url?: string;

  body?: string | object;
};

export async function fetchCordRESTApi<T>(
  endpoint: string,
  {
    method = 'GET',
    project_id,
    project_secret,
    api_url = 'https://api.cord.com/',
    body,
  }: FetchOptions,
): Promise<T> {
  const encodedBody =
    typeof body === 'undefined' || typeof body === 'string'
      ? body
      : JSON.stringify(body);

  const serverAuthToken = getServerAuthToken(project_id, project_secret);
  const response = await fetch(`${api_url}${endpoint}`, {
    method,
    body: encodedBody,
    headers: {
      Authorization: `Bearer ${serverAuthToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return await response.json();
  } else {
    const responseText = await response.text();
    throw new Error(
      `Error making Cord API call: ${response.status} ${response.statusText} ${responseText}`,
    );
  }
}
