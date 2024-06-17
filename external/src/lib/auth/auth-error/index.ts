import { APP_ORIGIN } from 'common/const/Urls.ts';
import { getParamFromLocation } from 'external/src/lib/auth/utils.ts';

// 'service': 'slack' | 'jira' | 'linear' | 'asana' | 'trello' (trello not in use)
const service = getParamFromLocation('service');
const message = getParamFromLocation('message');

// NB if our customer sets Cross-Origin-Opener-Policy=same-origin, window.opener will be null
// and this logic will not work.  For now we are ok with this, but have a workaround for the
// success case
window.opener?.postMessage(
  {
    service,
    message:
      message === 'cancelled' ? 'oauth_flow_cancelled' : 'oauth_flow_error',
  },
  APP_ORIGIN,
);

window.close();
