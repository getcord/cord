import { getDocumentTitle } from 'common/page_context/util.ts';

export function watchForDOMMutations(onChange: () => unknown) {
  const observer = new MutationObserver(onChange);
  observer.observe(document, {
    attributes: false,
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
  };
}

const origPushState = window.history.pushState.bind(window.history);
window.history.pushState = function (...args) {
  const result = origPushState(...args);
  window.dispatchEvent(new CustomEvent('cord:pushstate'));
  return result;
};

const origReplaceState = window.history.replaceState.bind(window.history);
window.history.replaceState = function (...args) {
  const result = origReplaceState(...args);
  window.dispatchEvent(new CustomEvent('cord:replacestate'));
  return result;
};

export function watchForLocationChanges(
  onChange: (location: string) => unknown,
) {
  let currentLocationHref = window.location.href;

  const maybeLocationChanged = () => {
    if (window.location.href !== currentLocationHref) {
      currentLocationHref = window.location.href;
      onChange(currentLocationHref);
    }
  };

  window.addEventListener('locationchange', maybeLocationChanged);
  window.addEventListener('hashchange', maybeLocationChanged);
  window.addEventListener('cord:pushstate', maybeLocationChanged);
  window.addEventListener('cord:replacestate', maybeLocationChanged);
  window.addEventListener('popstate', maybeLocationChanged);

  // this timer is to catch any location changes made through history.pushState/replaceState
  // it's so dumb, but there doesn't seem to be a better way of doing it :(
  // 1. there don't seem to be any events explicitly fired by changing the history state
  // 2. we can monkeypatch above but does it get everything?
  // it shouldn't impact performance since it's just a string comparison
  const interval = setInterval(maybeLocationChanged, 100);

  return () => {
    window.removeEventListener('locationchange', maybeLocationChanged);
    window.removeEventListener('hashchange', maybeLocationChanged);
    window.removeEventListener('cord:pushstate', maybeLocationChanged);
    window.removeEventListener('cord:replacestate', maybeLocationChanged);
    window.removeEventListener('popstate', maybeLocationChanged);
    clearInterval(interval);
  };
}

export function watchForDocumentTitleChanges(
  onChange: (title: string) => unknown,
) {
  let currentTitle = getDocumentTitle(document);

  const interval = setInterval(() => {
    const newTitle = getDocumentTitle(document);
    if (newTitle !== undefined && newTitle !== currentTitle) {
      currentTitle = newTitle;
      onChange(currentTitle);
    }
  }, 1000);

  return () => clearInterval(interval);
}
