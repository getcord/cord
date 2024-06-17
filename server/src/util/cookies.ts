import type { IncomingMessage } from 'http';
import { parse } from 'querystring';

import * as cookie from 'cookie';

import type { Session } from 'server/src/auth/index.ts';
import { UTM_COOKIE_KEY } from 'common/const/Cookies.ts';

import {
  GA_MEASUREMENT_COOKIE_KEY,
  GA_USER_COOKIE_KEY,
} from 'server/src/util/google-analytics.ts';

export function parseUtmParameters(utm: any) {
  if (typeof utm !== 'string') {
    return;
  }

  const query = parse(utm.replace(/^\?/, ''));
  let nonEmpty = false;
  const utmParameters: Session['utmParameters'] = {};

  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('utm_')) {
      utmParameters[key.substr(4)] = value;
      nonEmpty = true;
    }
  }

  if (nonEmpty) {
    return utmParameters;
  }

  return undefined;
}

function parametersFromCookie(value: string) {
  const parsedCookies = cookie.parse(value);

  return {
    utmParameters: parseUtmParameters(parsedCookies[UTM_COOKIE_KEY]),
    gaCookie: parsedCookies[GA_USER_COOKIE_KEY],
    gaMeasurementCookie: parsedCookies[GA_MEASUREMENT_COOKIE_KEY],
  };
}

export function parametersFromRequest(req: IncomingMessage) {
  return parametersFromCookie(req.headers.cookie || '');
}
