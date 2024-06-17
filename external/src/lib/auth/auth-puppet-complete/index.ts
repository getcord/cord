// Redirect page for successful Slack linking from SDK

/* allow any opener origin because in SDK world the flow can be started
 * from any origin. This is safe since the messages do not contain any sensitive data. */
const TARGET_ORIGIN = '*';
// NOTE: dont add any sensitive information here
const params = window.location.search.slice(1);

// Signal to the opening window that the oauth flow is complete, so that it can
// refresh the connection state.
// NB if our customer sets Cross-Origin-Opener-Policy=same-origin, window.opener will be null
// and this logic will not work.  We have a fallback in this case which watches for a change in
// the viewer.isSlackConnected property
window.opener?.postMessage(
  { message: 'oauth_flow_complete', data: params, service: 'slack' },
  TARGET_ORIGIN,
);

window.close();
