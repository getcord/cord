import {
  mondayAuthURL,
  mondayInstallURL,
} from 'external/src/lib/auth/utils.ts';

const install = document.getElementById('install-button');
if (install) {
  (install as HTMLAnchorElement).href = mondayInstallURL();
  install.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(
      mondayInstallURL(),
      '_blank',
      // Position the window 100px right and down from this one, so our window
      // is still visible as a reminder that this is step one of a multi-step
      // process.
      `width=650,height=900,left=${window.screenLeft + 100},top=${
        window.screenTop + 100
      }`,
    );
  });
}

const authorize = document.getElementById('auth-button');
const state = new URL(document.location.href).searchParams.get('state');
if (authorize && state) {
  (authorize as HTMLAnchorElement).href = mondayAuthURL(state);
}
