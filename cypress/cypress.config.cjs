const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    supportFile: false,
    includeShadowDom: true,
    experimentalMemoryManagement: true,
  },
  env: {
    TEST_APP_SECRET: process.env.TEST_APP_SECRET,
  },
});
