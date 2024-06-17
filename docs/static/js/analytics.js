/* eslint-disable */
// Google Analytics
(() => {
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-TWT8PD3');
})();

// Segment
(() => {
  !(function () {
    var analytics = (window.analytics = window.analytics || []);
    if (!analytics.initialize)
      if (analytics.invoked)
        window.console &&
          console.error &&
          console.error('Segment snippet included twice.');
      else {
        analytics.invoked = !0;
        analytics.methods = [
          'trackSubmit',
          'trackClick',
          'trackLink',
          'trackForm',
          'pageview',
          'identify',
          'reset',
          'group',
          'track',
          'ready',
          'alias',
          'debug',
          'page',
          'once',
          'off',
          'on',
          'addSourceMiddleware',
          'addIntegrationMiddleware',
          'setAnonymousId',
          'addDestinationMiddleware',
        ];
        analytics.factory = function (e) {
          return function () {
            var t = Array.prototype.slice.call(arguments);
            t.unshift(e);
            analytics.push(t);
            return analytics;
          };
        };
        for (var e = 0; e < analytics.methods.length; e++) {
          var key = analytics.methods[e];
          analytics[key] = analytics.factory(key);
        }
        analytics.load = function (key, e) {
          var t = document.createElement('script');
          t.type = 'text/javascript';
          t.async = !0;
          t.src =
            'https://cdn.segment.com/analytics.js/v1/' +
            key +
            '/analytics.min.js';
          var n = document.getElementsByTagName('script')[0];
          n.parentNode.insertBefore(t, n);
          analytics._loadOptions = e;
        };
        analytics._writeKey = 'ZWMYzMPfSedHMwmxIZ13XXCrbY3H50Zh';
        analytics.SNIPPET_VERSION = '4.13.2';
        analytics.load('ZWMYzMPfSedHMwmxIZ13XXCrbY3H50Zh');
        analytics.page();
      }
  })();
})();

// Microsoft Clarity
(function (c, l, a, r, i, t, y) {
  c[a] =
    c[a] ||
    function () {
      (c[a].q = c[a].q || []).push(arguments);
    };
  t = l.createElement(r);
  t.async = 1;
  t.src = 'https://www.clarity.ms/tag/' + i;
  y = l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t, y);
})(window, document, 'clarity', 'script', 'i4bszv858z');

// Cord, first-party events
(() => {
  const s = document.createElement('script');
  s.async = 1;
  s.src = 'https://cord.com/events.js';
  const n = document.getElementsByTagName('script')[0];
  n.parentNode.appendChild(s, n);
})();
