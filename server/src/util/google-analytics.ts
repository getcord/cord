import Env from 'server/src/config/Env.ts';

export const GA_USER_COOKIE_KEY = '_ga';
export const GA_MEASUREMENT_COOKIE_KEY = `_ga_${
  Env.GA_MEASUREMENT_ID.split('-')[1]
}`;

export type GACookieType = {
  cookie: string;
  measurementCookie: string;
} | null;

export function extractFromGACookies(gaCookie: GACookieType | undefined) {
  if (!gaCookie) {
    return null;
  }

  if (!gaCookie.cookie || !gaCookie.measurementCookie) {
    // We should have both in order to track a user in the session
    return null;
  }

  // Example GA1.1.1530219509.1692358124 and we need to remove the GA.1.1.
  const gaClientID = gaCookie.cookie.slice(6);

  // Example GS1.1.1692358123.1.1.1692360261.47.0.0 and we need to extract the
  // first large number between GS1.1. and .1.1.
  const gaSessionID = Number(gaCookie.measurementCookie.split('.')[2]);

  return {
    gaClientID,
    gaSessionID,
  };
}

const GA_MEASUREMENT_API_URL = `https://www.google-analytics.com/mp/collect?api_secret=${Env.GA_MEASUREMENT_PROTOCOL_API_SECRET}&measurement_id=${Env.GA_MEASUREMENT_ID}`;

export async function sendEventToGoogleAnalytics(
  eventName: string,
  clientID: string,
  sessionID: number,
) {
  try {
    // Sending to google analytics
    await fetch(GA_MEASUREMENT_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientID,
        non_personalized_ads: false,
        events: [
          {
            name: eventName,
            params: {
              items: [],
              session_id: sessionID,
            },
          },
        ],
      }),
    });
  } catch {
    //do nothing
  }
}
