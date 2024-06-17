import { API_SERVER_HOST } from 'common/const/Urls.ts';

export async function fetchSampleToken() {
  try {
    const resp = await fetch(`https://${API_SERVER_HOST}/sample-token`, {
      method: 'POST',
      body: '',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return (await resp.json()).client_auth_token as string | undefined;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
