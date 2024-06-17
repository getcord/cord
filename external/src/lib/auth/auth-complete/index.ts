import { APP_ORIGIN, CONSOLE_ORIGIN } from 'common/const/Urls.ts';
import { getParamFromLocation } from 'external/src/lib/auth/utils.ts';

// We use this page to indicate end of an oauth-flow (external tasks, slack
// linking of console support bot).  Slack linking from SDK uses auth-puppet-complete.

// 'service': 'slack' | 'jira' | 'linear' | 'asana' | 'trello' (trello not in use)
const service = getParamFromLocation('service');

function getOrigin() {
  if (getParamFromLocation('origin') === 'console') {
    return CONSOLE_ORIGIN;
  }
  // We technically do not need enforce the origin check and could return *
  // but better to stay on the safe side.
  // For task integrations we cannot enforce origin check as we need to send
  // the message to the customer's origin.
  if (service === 'slack') {
    return APP_ORIGIN;
  }
  return '*';
}

// Signal to the opening window that the oauth flow is complete, so that it can
// refresh the connection state or show other UI to confirm the connection was
// successful
window.opener?.postMessage(
  {
    service,
    message: 'oauth_flow_complete',
  },
  // WARNING - we assume the message we are posting DOES NOT contain any
  // sensitive data such as tokens etc.
  getOrigin(),
);
window.close();
