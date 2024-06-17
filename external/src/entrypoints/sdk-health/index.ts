// The cypress script should have set this
const tokenInLocalStorage = window.localStorage.getItem('testToken');

if (tokenInLocalStorage) {
  void window.CordSDK!.init({
    client_auth_token: tokenInLocalStorage,
  });
}
