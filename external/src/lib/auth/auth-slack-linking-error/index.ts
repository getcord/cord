import { Errors } from 'common/const/Errors.ts';
import { getParamFromLocation } from 'external/src/lib/auth/utils.ts';

// NB if our customer sets Cross-Origin-Opener-Policy=same-origin, window.opener will be null
// and this logic will not work.  For now we are ok with this, but have a workaround for the
// success case

/* allow any opener origin because in SDK world the flow can be started
 * from any origin. This is safe since the messages do not contain any sensitive data. */
const TARGET_ORIGIN = '*';
const service = getParamFromLocation('service');
const message = getParamFromLocation('message');

const errorMessageEl = document.getElementById('error-message');
// If we get this errorMessage from handler then the user has cancelled the flow
if (message === 'slack-login-access-denied') {
  window.opener?.postMessage(
    // NOTE: dont add any sensitive information here
    {
      service,
      message: 'oauth_flow_cancelled',
    },
    TARGET_ORIGIN,
  );

  window.close();
} else {
  if (message === Errors.PLATFORM_ORG_ALREADY_LINKED) {
    errorMessageEl!.textContent =
      'The Cord team is already linked with another Slack workspace. Please select the Slack workspace that is linked to the Cord team and try again.';
  } else if (message === Errors.PLATFORM_NEW_USER_NOT_FOUND) {
    errorMessageEl!.textContent = 'Error in create new user flow';
  } else {
    errorMessageEl!.textContent = `Error message: ${
      message ?? 'Unknown Error'
    }`;
  }

  window.opener?.postMessage(
    // NOTE: dont add any sensitive information here
    {
      service,
      message: 'oauth_flow_error',
    },
    TARGET_ORIGIN,
  );
}
