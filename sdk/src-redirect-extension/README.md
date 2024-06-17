This extension installs a request interceptor for https://app.cord.com/sdk/v1/sdk.latest.js and redirects it to a URL configured in the extension's Options page.

This is useful to test local changes in customer's websites that don't yet support the `localStorage` `cord_override_script_url` feature (because they haven't updated their npm package) or that don't use our npm package at all.

To use this, first install it into Chrome, first go to chrome://extensions/ click "Load unpacked", then point it at this folder. Once the extension is installed, click through into its Options, and set the URL in that input to whatever you want and click Save. You should now see all network requests redirected in the Network developer tools panel.
