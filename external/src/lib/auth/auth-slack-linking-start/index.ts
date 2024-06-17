import { slackLoginURL } from 'common/util/oauth.ts';
import { getAuthNonceFromCookie } from 'external/src/lib/auth/utils.ts';
import { CONSOLE_ORIGIN } from 'common/const/Urls.ts';

// When a console user clicks the Connect to Slack button (to link their Slack org
// for the support bot functionality) we redirect them to /auth-slack-linking-start.html
// and generate a 'nonce' which we send back to the opening window and set in cookies.
// The opening window should then call a graphql query to encode this, along with
// userID and orgID, and return the encoded value back to this window, which then
// redirects to the Slack Auth flow with the encoded token in the state.  After a
// successful auth with Slack, the user will be redirected to our SlackAuthRedirectHandler
// on api.cord.com, which will check the state param passed along from Slack,
// decode it, and verify that it matches the accompanying cookies

export type SlackFlowMessageData = {
  state: string;
  team: string | null;
};

const redirectToSlack = (event: MessageEvent<SlackFlowMessageData>) => {
  if (event.origin === CONSOLE_ORIGIN && event.source === window.opener) {
    window.location.replace(slackLoginURL(event.data.state, event.data.team));
  }
};

const nonce = getAuthNonceFromCookie();
window.opener?.postMessage({ nonce }, CONSOLE_ORIGIN);

window.addEventListener('message', (event) => redirectToSlack(event));
