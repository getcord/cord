let redirectUrl = undefined;

const setRedirectURL = (url) => {
  redirectUrl = url || undefined;
};

// get initial value when extension loads
window.chrome.storage.local.get('url', ({ url }) => setRedirectURL(url));

// listen for value changes (coming from options page)
window.chrome.storage.onChanged.addListener(({ url }) => {
  if (url) {
    setRedirectURL(url.newValue);
  }
});

window.chrome.webRequest.onBeforeRequest.addListener(
  () => ({ redirectUrl }),
  { urls: ['https://app.cord.com/sdk/v1/sdk.latest.js'] },
  ['blocking'],
);
