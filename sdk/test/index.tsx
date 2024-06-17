import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import * as ReactDOM from 'react-dom';

import { CordApisPlayground } from 'sdk/test/examples/APIs.tsx';
import type {
  ComposerSize,
  HTMLCordFloatingThreadsElement,
  HTMLCordSidebarElement,
  InitErrorCallback,
  Location,
  NavigateFn,
  ScreenshotConfig,
  SortDirection,
  SearchOptionsType,
} from '@cord-sdk/types';
import { COMPOSER_SIZE } from '@cord-sdk/types';
import {
  betaV2,
  notification,
  presence,
  thread,
  user as userHooks,
  CordProvider,
  Inbox,
  InboxLauncher,
  SidebarLauncher,
  PagePresence,
  PresenceFacepile,
  PresenceObserver,
  Sidebar,
  useCordAnnotationCaptureHandler,
  useCordAnnotationClickHandler,
  useCordAnnotationRenderer,
  useCordAnnotationTargetRef,
  NotificationListLauncher,
  FloatingThreads,
  NotificationList,
  Composer,
  Message,
  ThreadedComments,
  Notification,
  MessageContent,
  LiveCursors,
  liveCursorsDefaultEventToLocation,
  liveCursorsDefaultLocationToDocument,
  LiveCursorsDefaultCursor,
} from '@cord-sdk/react';
import type { LiveCursorsCursorProps } from '@cord-sdk/react';
import { API_SERVER_HOST, APP_SERVER_HOST } from 'common/const/Urls.ts';
import { CordThreadExample } from 'sdk/test/examples/cordThread.tsx';
import { CordThreadListExample } from 'sdk/test/examples/cordThreadList.tsx';
import { PinExample } from 'sdk/test/examples/cordPin.tsx';
import { NewCssComponentsExample } from 'sdk/test/examples/newCssComponents.tsx';
import type { IPrivateCordComponent } from 'sdk/client/core/components/index.tsx';
import { isValidMetadata } from 'common/types/index.ts';
import { CanaryTestbed } from 'sdk/test/canary.tsx';

const MODES = ['Canary 🐤', 'OG'] as const;
type Mode = (typeof MODES)[number];

const paragraphs = [
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of 'de Finibus Bonorum et Malorum' (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, 'Lorem ipsum dolor sit amet..', comes from a line in section 1.10.32.",
];

function useStateWithLocalStoragePersistence<T>(
  key: string,
): readonly [T | undefined, (value: T | undefined) => void];

function useStateWithLocalStoragePersistence<T>(
  key: string,
  defaultValue: T,
): readonly [T, (value: T) => void];

function useStateWithLocalStoragePersistence<T>(key: string, defaultValue?: T) {
  const [value, setValue] = useState(() => {
    const localStorageValue = localStorage.getItem(key);
    if (localStorageValue === null) {
      return defaultValue;
    }

    return JSON.parse(localStorageValue) as T;
  });

  useEffect(() => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

const PAGES = ['testbed', 'foo', 'bar'] as const;
type Page = (typeof PAGES)[number];

const COMPONENT_SETS = [
  'annotations',
  'presence',
  'threads',
  'threaded-comments',
  'notifications',
  'other',
  'new-css',
  'cuddle',
  'all',
  'just-thread',
  'search',
  'api-playground',
] as const;
type ComponentSet = (typeof COMPONENT_SETS)[number];

const PAGES_BLUR_SCREENSHOTS = {
  testbed: true,
  foo: false,
  bar: true,
} as const;

function PresenceNames(props: {
  location: Location;
  placeholder: string;
  onlyPresentUsers?: boolean;
}) {
  const presentUsers =
    presence.useLocationData(props.location, {
      exclude_durable: props.onlyPresentUsers,
    }) ?? [];

  const userData = userHooks.useUserData(presentUsers.map((pu) => pu.id));

  return (
    <>
      {presentUsers.length > 0
        ? presentUsers
            .filter((pu) => !!userData[pu.id])
            .map(
              (presentUser) =>
                `${userData[presentUser.id]!.name} (${
                  presentUser.ephemeral.locations.length > 0
                    ? 'here'
                    : presentUser.durable?.timestamp.toISOString()
                })`,
            )
            .join(', ')
        : props.placeholder}
    </>
  );
}

function App() {
  const [mode, setMode] =
    useStateWithLocalStoragePersistence<Mode>('Canary 🐤');
  const [user, setUser] = useStateWithLocalStoragePersistence<string>(
    'user_og',
    'andrei',
  );
  const [showPresence, setShowPresence] = useState(true);
  const [isEditingMessage, setIsEditingMessage] = useState<
    string | undefined
  >();
  const [tokens, setTokens] = useState<undefined | Record<string, string>>(
    undefined,
  );

  const [showCrossDomainIframe, setShowCrossDomainIframe] = useState(false);

  const [page, setPage] = useStateWithLocalStoragePersistence<Page>(
    'page',
    'testbed',
  );

  const [
    partialMatchForThreadActivitySummary,
    setPartialMatchForThreadActivitySummary,
  ] = useState(false);

  const [componentSet, setComponentSet] =
    useStateWithLocalStoragePersistence<ComponentSet>(
      'component_set_og',
      'annotations',
    );

  const [showSidebarComponent, setShowSidebarComponent] =
    useStateWithLocalStoragePersistence('show_sidebar', true);
  const [showLiveCursors, setShowLiveCursors] =
    useStateWithLocalStoragePersistence('show_live_cursors', false);
  const [hasNewComposer, setHasNewComposer] =
    useStateWithLocalStoragePersistence('has_new_composer', false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFloatingThreadsComponent, setShowFloatingThreadsComponent] =
    useStateWithLocalStoragePersistence('show_floating_threads_1', false);
  const [showFloatingThreadsComponent2, setShowFloatingThreadsComponent2] =
    useStateWithLocalStoragePersistence('show_floating_threads_2', false);
  const [showCommentModeComponent, setShowCommentModeComponent] =
    useStateWithLocalStoragePersistence('show_floating_threads_3', false);
  const floatingThreadsElementRef = useRef<
    (HTMLCordFloatingThreadsElement & IPrivateCordComponent) | null
  >(null);
  const floatingThreadsElementRef2 = useRef<
    (HTMLCordFloatingThreadsElement & IPrivateCordComponent) | null
  >(null);
  const commentModeComponentRef = useRef<
    (HTMLCordFloatingThreadsElement & IPrivateCordComponent) | null
  >(null);
  const [inCommentMode, setInCommentMode] = useState(false);
  const [composerSize, setComposerSize] = useState<ComposerSize | undefined>(
    'medium',
  );

  //message API
  const [messageID, setMessageID] = useState<string | undefined>();
  const messageIDInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tokens === undefined) {
      void fetch(new Request(`https://${API_SERVER_HOST}/sdk/test/tokens`), {
        // send cookies in cross origin requests
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch tokens: ${response.status}`);
          }
          return response.json();
        })
        .then(setTokens);
    }
  }, [tokens]);

  useEffect(() => {
    if (showSidebarComponent && sidebarOpen) {
      document.body.classList.add('with-cord-sidebar');
    } else {
      document.body.classList.remove('with-cord-sidebar');
    }
  }, [showSidebarComponent, sidebarOpen]);

  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const [srsBsns, setSrsBsns] = useState(
    document.location.search.includes('srsbsns'),
  );
  useEffect(() => {
    // (Remove Comic Sans.)
    document.body.classList.toggle('srsbsns', srsBsns);
  }, [srsBsns]);

  const [invertAnnotationMode, setInvertAnnotationMode] = useState(false);

  const [VHToBodyTag, setVHToBodyTag] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('fix-height', VHToBodyTag);
  }, [VHToBodyTag]);
  const sidebarElementRef = useRef<
    (HTMLCordSidebarElement & IPrivateCordComponent) | null
  >(null);

  const allPagesSettingsRef = useRef<HTMLDivElement | null>(null);
  const boxElementRef = useRef<HTMLDivElement | null>(null);

  const [screenshotConfig, setScreenshotConfig] = useState<
    ScreenshotConfig | undefined
  >();

  const navigate = useCallback<NavigateFn>((url, location, identity) => {
    console.log(
      `navigate called for : ${url} with location`,
      location,
      'identity',
      identity,
    );
    return false;
  }, []);

  const onInitError = useCallback<InitErrorCallback>(
    (e) => console.log('onInitError', e),
    [],
  );

  useEffect(() => {
    if (tokens && !tokens[user]) {
      setUser('andrei');
    }
  }, [setUser, tokens, user]);

  if (tokens === undefined) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <h1>Cord Components Testbed</h1>
      <p>
        Mode:{' '}
        <select
          onChange={(e) => {
            setMode(e.target.value as Mode);
          }}
          value={mode}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-shadow */}
          {MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </p>

      {mode === 'Canary 🐤' ? (
        <CanaryTestbed />
      ) : (
        <CordProvider
          clientAuthToken={tokens[user]}
          enableAnnotations={true}
          enableTasks={true}
          enableSlack={true}
          screenshotOptions={{
            show_blurred: 'everywhere',
            blur: PAGES_BLUR_SCREENSHOTS[page],
          }}
          cordScriptUrl={`https://${APP_SERVER_HOST}/sdk/v1/sdk.latest.js`}
          navigate={navigate}
          // threadOptions={{ additionalSubscribersOnCreate: ['flooey'] }}
          onInitError={onInitError}
          customEventMetadata={{ foo: { bar: 'baz' } }}
        >
          {showLiveCursors && (
            <CustomLiveCursors
              page={page}
              allPagesSettingsRef={allPagesSettingsRef}
              boundingElementRef={boxElementRef}
            />
          )}
          <div className="page-wide-settings" ref={allPagesSettingsRef}>
            <h3>All Pages Settings</h3>
            <p>
              User:{' '}
              <select
                onChange={(e) => {
                  const result = setUser(e.target.value);
                  // Refresh the tokens if the user changes,
                  // just in case it has been more than a minute
                  setTokens(undefined);
                  return result;
                }}
                value={user}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one! */}
                {Object.keys(tokens).map((user) => (
                  <option key={user}>{user}</option>
                ))}
              </select>{' '}
            </p>
            <p>
              <button onClick={() => setDarkMode(!darkMode)} type="button">
                toggle dark mode
              </button>{' '}
              <button onClick={() => setSrsBsns(!srsBsns)} type="button">
                toggle srs bsns fonts
              </button>{' '}
              <button
                onClick={() => setVHToBodyTag(!VHToBodyTag)}
                type="button"
              >
                toggle 100vh to body
              </button>{' '}
            </p>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={showSidebarComponent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShowSidebarComponent(e.target.checked)
                  }
                />
                Sidebar
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={hasNewComposer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setHasNewComposer(e.target.checked);
                  }}
                />
                with new Composer
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showLiveCursors}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShowLiveCursors(e.target.checked)
                  }
                />
                Live Cursors
              </label>
              {showSidebarComponent && (
                <Sidebar
                  ref={sidebarElementRef}
                  location={{ page }}
                  showPresence={true}
                  showInbox={true}
                  showCloseButton={true}
                  excludeViewerFromPresence={false}
                  showLauncher={true}
                  showAllActivity={true}
                  onOpen={() => {
                    setSidebarOpen(true);
                  }}
                  onClose={() => {
                    setSidebarOpen(false);
                  }}
                  //@ts-ignore
                  newComponentSwitchConfig={{ composer: hasNewComposer }}
                />
              )}
            </div>
            <p>
              Location page:
              <select
                onChange={(e) => setPage(e.target.value as Page)}
                value={page}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one! */}
                {PAGES.map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </p>
            <label>
              Component set:{' '}
              <select
                onChange={(e) => {
                  setComponentSet(e.target.value as ComponentSet);
                }}
                value={componentSet}
              >
                {COMPONENT_SETS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          {(componentSet === 'annotations' || componentSet === 'all') && (
            <>
              <h2>Annotations</h2>
              <div>
                <p>Component Toggles</p>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={showFloatingThreadsComponent}
                      onChange={(e) =>
                        setShowFloatingThreadsComponent(e.target.checked)
                      }
                    />
                    Floating Threads component
                  </label>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={showFloatingThreadsComponent2}
                      onChange={(e) =>
                        setShowFloatingThreadsComponent2(e.target.checked)
                      }
                    />
                    Another Floating Threads component
                  </label>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={showCommentModeComponent}
                      onChange={(e) =>
                        setShowCommentModeComponent(e.target.checked)
                      }
                    />
                    Continual Comment mode
                  </label>
                </div>
              </div>
              <hr />
              <button
                onClick={() => {
                  floatingThreadsElementRef.current?.createThread();
                }}
                type="button"
              >
                create annotation
              </button>{' '}
              {showFloatingThreadsComponent && (
                <FloatingThreads
                  location={{ page }}
                  ref={floatingThreadsElementRef}
                  buttonLabel={'Create a new floating thread yo'}
                  threadName="Lorem Ipsum paragraph"
                  showScreenshotPreview={true}
                  //@ts-ignore
                  newComponentSwitchConfig={{ composer: hasNewComposer }}
                />
              )}
              {showFloatingThreadsComponent2 && (
                <FloatingThreads
                  location={{ page }}
                  ref={floatingThreadsElementRef2}
                  buttonLabel={'another one'}
                  //@ts-ignore
                  newComponentSwitchConfig={{ composer: hasNewComposer }}
                />
              )}
              {showCommentModeComponent && (
                <div>
                  <button
                    data-cord-annotation-allowed={false}
                    onClick={() => {
                      if (inCommentMode) {
                        setScreenshotConfig(undefined);
                        commentModeComponentRef.current?.cancelThread();
                      } else {
                        setScreenshotConfig({
                          screenshotUrlOverride:
                            'https://placedog.net/1920/1080?random',
                        });
                        commentModeComponentRef.current?.createThread();
                      }
                      setInCommentMode(!inCommentMode);
                    }}
                    type="button"
                  >
                    {inCommentMode ? 'Exit Comment Mode' : 'Enter Comment Mode'}
                  </button>
                  <FloatingThreads
                    location={{ page }}
                    ref={commentModeComponentRef}
                    threadName="Lorem Ipsum paragraph"
                    screenshotConfig={screenshotConfig}
                    onFinish={(threadID) => {
                      commentModeComponentRef.current?.createThread();
                      commentModeComponentRef.current?.openThread(threadID);
                    }}
                    onCancel={() => {
                      setInCommentMode(false);
                    }}
                    showButton={false}
                    //@ts-ignore
                    newComponentSwitchConfig={{ composer: hasNewComposer }}
                  />
                </div>
              )}
              <CustomTextAnnotationExample page={page} />
              <div data-cord-annotation-allowed={!invertAnnotationMode}>
                {paragraphs.map((text, index) => (
                  <div key={index} className="text-container">
                    <div className="presence-facepile-left">
                      <PresenceFacepile
                        location={{ page, paragraph: index }}
                        maxUsers={3}
                        onlyPresentUsers={true}
                        excludeViewer={false}
                        orientation="vertical"
                      />
                    </div>
                    <PresenceObserver
                      location={{ page, paragraph: index }}
                      presentEvents={['mouseEnter', 'focusIn']}
                      absentEvents={['mouseLeave', 'focusOut']}
                    >
                      <p>{text}</p>
                      <p>
                        <small>
                          Users reading this:{' '}
                          <PresenceNames
                            location={{ page, paragraph: index }}
                            placeholder={'none'}
                            onlyPresentUsers={true}
                          />
                        </small>{' '}
                        <input type="text" placeholder="just an input" />
                      </p>
                    </PresenceObserver>
                  </div>
                ))}

                <p data-cord-annotation-allowed={false}>
                  This paragraph cannot be annotated. This paragraph cannot be
                  annotated. This paragraph cannot be annotated. This paragraph
                  cannot be annotated. This paragraph cannot be annotated. This
                  paragraph cannot be annotated. This paragraph cannot be
                  annotated. This paragraph cannot be annotated. This paragraph
                  cannot be annotated. This paragraph cannot be annotated. This
                  paragraph cannot be annotated.
                </p>

                <p data-cord-annotation-allowed={true}>
                  <label>
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setInvertAnnotationMode(e.target.checked)
                      }
                    />{' '}
                    Make this paragraph the only one that can be annotated.
                  </label>
                </p>
              </div>
              <PinExample user={user} location={{ page }} />
              <VideoExample />
              <div>
                <p>
                  <button
                    onClick={() =>
                      setShowCrossDomainIframe(!showCrossDomainIframe)
                    }
                    type="button"
                  >
                    toggle cross-domain iframe
                  </button>
                </p>
                {showCrossDomainIframe && (
                  <iframe
                    src="https://andrei.codes/iframe.html"
                    width="600"
                    height="300"
                  ></iframe>
                )}
              </div>
              <h4>Scrolling Container</h4>
              <div
                style={{
                  height: 400,
                  overflow: 'auto',
                  border: '1px solid grey',
                }}
              >
                {[paragraphs, paragraphs, paragraphs].flat().join(' ')}
              </div>
              <div
                style={{
                  height: 400,
                  overflow: 'auto',
                  border: '1px solid grey',
                }}
              >
                {[paragraphs, paragraphs, paragraphs].flat().map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </>
          )}
          {(componentSet === 'presence' || componentSet === 'all') && (
            <>
              <h2>Presence</h2>
              <button
                onClick={() => setShowPresence(!showPresence)}
                type="button"
              >
                toggle presence
              </button>{' '}
              {showPresence && (
                <p>
                  Users on this page:{' '}
                  <PresenceNames
                    location={{ page }}
                    placeholder={'none'}
                    onlyPresentUsers={false}
                  />
                </p>
              )}
              {showPresence && (
                <PagePresence
                  id="page-presence"
                  location={{ page }}
                  orientation="vertical"
                />
              )}
              <TableExample page={page} />
              <div
                ref={boxElementRef}
                style={{
                  width: '500px',
                  height: '500px',
                  border: 'solid green 1px',
                }}
              >
                simple box
              </div>
            </>
          )}
          {(componentSet === 'threads' || componentSet === 'all') && (
            <>
              <h2>Threads</h2>
              <h4>Composer</h4>
              <p>
                <label>
                  Create new threads composer size:{' '}
                  <select
                    onChange={(e) => {
                      setComposerSize(e.target.value as ComposerSize);
                    }}
                    value={composerSize}
                  >
                    {COMPOSER_SIZE.map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>
                </label>
              </p>
              Creates new threads:
              <div style={{ maxWidth: '400px' }}>
                <Composer
                  location={{ page }}
                  autofocus
                  threadName="Sent from my testbed composer"
                  showCloseButton={true}
                  size={composerSize}
                />
              </div>
              Uses thread abc123:
              <div style={{ maxWidth: '400px' }}>
                <Composer location={{ page }} threadId="abc123" />
              </div>
              <h4>Activity API</h4>
              <label>
                <input
                  type="checkbox"
                  checked={partialMatchForThreadActivitySummary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPartialMatchForThreadActivitySummary(e.target.checked)
                  }
                />
                Enable partial matching
              </label>
              <ActivityCount
                page={page}
                partialMatch={partialMatchForThreadActivitySummary}
              />
              <h4>Thread API (just the .thread part) - threadID: abc123</h4>
              <ThreadSummary threadID={'abc123'} />
              <h4>Use Message API</h4>
              <label htmlFor="cord-testbed-message-id">messageID:</label>
              <input
                id="cord-testbed-message-id"
                ref={messageIDInputRef}
                type="text"
                placeholder={'abc123'}
              />
              <button
                onClick={() =>
                  setMessageID(messageIDInputRef.current?.value ?? undefined)
                }
                type="button"
              >
                fetch message
              </button>
              {messageID && <UseMessage messageID={messageID} />}
              <h4>Thread List</h4>
              <CordThreadExample />
              <CordThreadListExample
                floatingThreadsElementRef={floatingThreadsElementRef}
              />
            </>
          )}
          {componentSet === 'just-thread' && <CordThreadExample />}
          {(componentSet === 'search' || componentSet === 'all') && (
            <SearchAPI />
          )}
          {(componentSet === 'threaded-comments' || componentSet === 'all') && (
            <>
              <h2>Open-source Threaded Comments</h2>
              <h4>Location: {page}</h4>
              <ThreadedComments
                location={{ page }}
                scrollDirection="up"
                composerPosition="bottom"
                topLevelComposerExpanded
                displayResolved="tabbed"
              />

              <br />
              <br />
              <h2>Message</h2>
              <h4>First Message of Thread: `abc123`</h4>
              <div style={{ border: '1px solid green', width: '800px' }}>
                <Message
                  threadId={'abc123'}
                  isEditing={isEditingMessage === 'abc123'}
                  onEditEnd={() => {
                    setIsEditingMessage(undefined);
                  }}
                />
              </div>

              <button
                onClick={() => {
                  setIsEditingMessage('abc123');
                }}
                type="button"
                style={{
                  margin: '20px',
                  padding: '10px',
                  border: '1px solid blue',
                }}
              >
                Click this to start editing message abc123
              </button>
              <h2>Message Content</h2>
              <h4>First Message Content of Thread: `abc123`</h4>
              <div style={{ border: '1px solid deeppink', width: '800px' }}>
                <MessageContentTest />
              </div>
            </>
          )}
          {(componentSet === 'notifications' || componentSet === 'all') && (
            <>
              <h2>Notifications in page: {page}</h2>
              <div style={{ display: 'flex' }}>
                <div>
                  <h4>Notification List</h4>
                  <NotificationList
                    style={{ height: '450px', width: '304px' }}
                    maxCount={10}
                    fetchAdditionalCount={3}
                  />
                </div>

                <div style={{ marginLeft: '50px' }}>
                  <h4>Notification List Launcher</h4>
                  <NotificationListLauncher />
                </div>
              </div>
              <NotificationsCount page={page} />
              <NotificationsData page={page} />
              <hr />
              <h4>Inbox Launcher</h4>
              <InboxLauncher
                iconUrl={'https://imgur.com/NjoPt4U.jpeg'}
                showSettings={true}
              />
              <h4>Plain old Inbox</h4>
              <Inbox showCloseButton={false} showSettings={true} />
            </>
          )}
          {(componentSet === 'other' || componentSet === 'all') && (
            <>
              <h2>Other Stuff</h2>
              <SidebarLauncher />
            </>
          )}
          {componentSet === 'new-css' && <NewCssComponentsExample />}
          {componentSet === 'api-playground' && <CordApisPlayground />}
        </CordProvider>
      )}
    </>
  );
}

function TableRow({
  page,
  row,
}: {
  page: string;
  row: { id: number; label: string };
}) {
  const location = { page, element: 'table2', row: row.id };

  const annotationTargetRef =
    useCordAnnotationTargetRef<HTMLTableRowElement>(location);

  useCordAnnotationCaptureHandler(location, (capturePosition, _element) => {
    return {
      label: 'Table Row ' + row.id,
      extraLocation: {
        originalX: capturePosition.x,
        originalY: capturePosition.y,
      },
    };
  });

  useCordAnnotationRenderer(location, (_annotation, relativeCoords) => {
    if (annotationTargetRef.current) {
      return {
        coordinates: {
          x: relativeCoords.x * annotationTargetRef.current.clientWidth,
          y: relativeCoords.y * annotationTargetRef.current.clientHeight,
        },
        element: annotationTargetRef.current,
        tooltip: 'Clickety click',
      };
    } else {
      return undefined;
    }
  });

  const presentUsers = (
    presence.useLocationData(location, {
      exclude_durable: false,
    }) ?? []
  ).filter((pu) => pu.ephemeral.locations.length > 0);

  return (
    <>
      <tr key={row.id} ref={annotationTargetRef}>
        <td>{row.id}</td>
        <td>
          <PresenceObserver location={location}>
            <div
              style={{
                background: presentUsers.length > 0 ? '#ffffcc' : 'none',
              }}
            >
              {row.label}
            </div>
          </PresenceObserver>
        </td>
        <td>{presentUsers.map((u) => u.id).join(', ')}</td>
      </tr>
    </>
  );
}

type VideoPlayerAnnotation = {
  page: string;
  time: number;
};
function VideoExample() {
  const [showVideo, setShowVideo] = useState(false);
  const videoLocation = { page: 'video' };

  const videoElementRef =
    useCordAnnotationTargetRef<HTMLVideoElement>(videoLocation);

  useCordAnnotationCaptureHandler<VideoPlayerAnnotation>(videoLocation, () => {
    const time = videoElementRef.current?.currentTime ?? 0;
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },
      label: 'Video: ' + time,
    };
  });

  useCordAnnotationRenderer(videoLocation, (_annotation) => {
    if (!videoElementRef.current) {
      // if the video element is for some reason not rendered yet,
      // don't show the annotation pin
      return;
    }

    return {
      coordinates: { x: '0px', y: '0px' },
      element: videoElementRef.current,
    };
  });

  return (
    <>
      <button onClick={() => setShowVideo((prev) => !prev)} type="button">
        Show video
      </button>
      {showVideo && (
        <video
          ref={videoElementRef}
          controls
          height={250}
          src="https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
        ></video>
      )}
    </>
  );
}

function TableExample({ page }: { page: string }) {
  const [rows, setRows] = useState([
    { id: 1, label: 'hey now' },
    { id: 2, label: "you're an all star" },
    { id: 3, label: 'get your game on' },
    { id: 4, label: 'go play' },
  ]);

  const location = { page, element: 'table2' };

  const tableRef = useCordAnnotationTargetRef<HTMLTableElement>(location);

  // useEffect(() => {
  //   let t = 0;
  //   const interval = setInterval(() => {
  //     t += 0.01;
  //     const x = Math.sin(t) * 50;
  //     const y = Math.cos(t) * 50;
  //     const scale = (Math.sin(t) + 1) / 8 + 0.75;
  //     if (tableRef.current) {
  //       tableRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  //     }
  //   }, 16);
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, []);

  useCordAnnotationClickHandler<{
    page: string;
    element: string;
    row?: number;
  }>(location, (annotation) => {
    if (annotation.location.row) {
      setRows([
        {
          id: annotation.location.row - 1,
          label: `row ${annotation.location.row - 1}`,
        },
        {
          id: annotation.location.row,
          label: `row ${annotation.location.row}`,
        },
        {
          id: annotation.location.row + 1,
          label: `row ${annotation.location.row + 1}`,
        },
      ]);
    }
  });

  return (
    <table ref={tableRef}>
      <tbody>
        {rows.map((row) => (
          <TableRow key={row.id} row={row} page={page} />
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3}>
            <button
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
                setRows((rows) =>
                  rows.map((row) => ({
                    ...row,
                    id: Math.floor(Math.random() * 1000),
                  })),
                );
              }}
              type="button"
            >
              random
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function CustomTextAnnotationExample({ page }: { page: string }) {
  const ref = useCordAnnotationTargetRef<HTMLParagraphElement>({
    page,
  });

  return <div ref={ref}>This is a custom annotation target!</div>;
}

function ActivityCount({
  page,
  partialMatch,
}: {
  page: string;
  partialMatch: boolean;
}) {
  const threads = thread.useThreadCounts({
    filter: {
      location: page
        ? {
            value: { page },
            partialMatch,
          }
        : undefined,
      metadata: {},
      resolvedStatus: 'any',
    },
  });

  if (!threads) {
    return null;
  }
  return (
    <>
      <p>
        Stats for location: {page} {partialMatch ? 'with partial matching' : ''}
      </p>
      <ul>
        <li>total threads: {threads.total}</li>
        <li>unread threads: {threads.unread}</li>
        <li>unread subscribed threads: {threads.unreadSubscribed}</li>
        <li>resolved threads: {threads.resolved}</li>
      </ul>
    </>
  );
}

function NotificationsCount({ page }: { page: string }) {
  const notificationSummary = notification.useNotificationCounts({
    filter: { location: { page } },
  });
  if (!notificationSummary) {
    return null;
  }

  return <p>Unread notifications: {notificationSummary.unread}</p>;
}

function NotificationsData({ page }: { page: string }) {
  const data = notification.useNotifications({
    filter: { location: { page } },
  });
  const firstNotif = data.notifications.at(0);
  const lastNotif = data.notifications.at(-1);

  return (
    <div>
      <p>Notifications data hook:</p>
      <ul>
        <li>Length of list: {data.notifications.length}</li>
        <li>First in list: {firstNotif?.id}</li>
        <li>Last in list: {lastNotif?.id}</li>
        <li>loading: {data.loading ? 'true' : 'false'}</li>
        <li>hasMore: {data.hasMore ? 'true' : 'false'}</li>
        <li>
          <button onClick={() => void data.fetchMore(5)} type="button">
            Fetch 5 more
          </button>
        </li>
      </ul>
      <p>
        First notification from data hook (will change as new notifs are
        created):
      </p>
      {firstNotif ? (
        <Notification notificationId={firstNotif.id} />
      ) : (
        '(empty list)'
      )}
      <p>
        Last notification from data hook, rendered (will change as fetch more is
        pushed):
      </p>
      {lastNotif ? (
        <Notification notificationId={lastNotif.id} />
      ) : (
        '(empty list)'
      )}
    </div>
  );
}

function ThreadSummary({ threadID }: { threadID: string }) {
  const data = thread.useThread(threadID);

  const threadData = data.thread;

  if (!data || !threadData) {
    return null;
  }

  return (
    <ul>
      <li>total messages: {threadData.total}</li>
      <li>unread messages: {threadData.unread}</li>
      <li>is resolved: {threadData.resolved.toString()}</li>
      <li>participants: {threadData.participants.length}</li>
      <li>
        typing users:{' '}
        {threadData.typing.length === 0
          ? 'nobody...'
          : threadData.typing.join(', ')}
      </li>
      <li>
        viewer is thread participant:{' '}
        {threadData.viewerIsThreadParticipant.toString()}
      </li>
      <li>first message ID: {threadData.firstMessage?.id ?? '(none)'}</li>
      <li>
        first message created timestamp:{' '}
        {threadData.firstMessage?.createdTimestamp.toString() ?? '(none)'}
      </li>
      <li>
        first message deleted timestamp:{' '}
        {threadData.firstMessage?.deletedTimestamp?.toString() ?? '(none)'}
      </li>
      <li>
        first message seen:{' '}
        {threadData.firstMessage?.seen.toString() ?? '(none)'}
      </li>
    </ul>
  );
}

function MessageContentTest() {
  const threadData = thread.useThread('abc123');

  if (!threadData || !threadData.thread) {
    return null;
  }

  return (
    <MessageContent
      content={threadData.thread.firstMessage?.content}
      attachments={threadData.thread.firstMessage?.attachments}
      edited={!!threadData.thread.firstMessage?.updatedTimestamp}
    />
  );
}

function SearchAPI() {
  const [textToMatch, setTextToMatch] = useState('hi');
  const [authorID, setAuthorID] = useState('andrei');
  const [orgID, setOrgID] = useState('cord');
  const [groupID, setGroupID] = useState('cord');
  const [location, setLocation] = useState<string>('testbed');
  const [partialMatch, setPartialMatch] = useState(false);
  const [metadata, setMetadata] = useState();
  const [limit, setLimit] = useState<number | undefined>();
  const threadMetadataInputRef = useRef<HTMLInputElement>(null);
  const [sortBy, setSortBy] = useState<
    SearchOptionsType['sortBy'] | undefined
  >();
  const [sortDirection, setSortDirection] = useState<
    SortDirection | undefined
  >();

  const [fromTimestamp, setFromTimestamp] = useState<string | undefined>(
    undefined,
  );
  const [toTimestamp, setToTimestamp] = useState<string | undefined>(undefined);
  const updateMetadata = useCallback(() => {
    const metadataInput = threadMetadataInputRef.current?.value;

    if (metadataInput && !isValidMetadata(JSON.parse(metadataInput))) {
      threadMetadataInputRef.current?.setCustomValidity('Invalid metadata');
      threadMetadataInputRef.current?.reportValidity();
      return;
    }

    setMetadata(metadataInput ? JSON.parse(metadataInput) : undefined);
  }, []);
  const result = thread.useSearchMessages({
    textToMatch,
    authorID,
    orgID,
    groupID,
    locationOptions: {
      location: { page: location },
      partialMatch,
    },
    timestampRange: {
      from: fromTimestamp ? new Date(fromTimestamp) : undefined,
      to: toTimestamp ? new Date(toTimestamp) : undefined,
    },
    metadata,
    limit,
    sortBy,
    sortDirection,
  });

  return (
    <>
      <h4>Search API</h4>
      <label>
        Text to match
        <input
          value={textToMatch}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTextToMatch(e.target.value)
          }
        />
      </label>
      <br />
      <label>
        External author id
        <input
          value={authorID}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAuthorID(e.target.value)
          }
        />
      </label>
      <br />
      <label>
        External org id (deprecated)
        <input
          value={orgID}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOrgID(e.target.value)
          }
        />
      </label>
      <br />
      <label>
        External groupID (use instead of orgID)
        <input
          value={groupID}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setGroupID(e.target.value)
          }
        />
      </label>
      <br />
      <label>
        Location
        <select
          onChange={(e) => setLocation(e.target.value as Page)}
          value={location}
        >
          {PAGES.map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
      </label>
      <label>
        Partial match
        <input
          type="checkbox"
          checked={partialMatch}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPartialMatch(e.target.checked)
          }
        />
      </label>
      <label>
        From
        <input
          type={'date'}
          value={fromTimestamp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFromTimestamp(e.target.value)
          }
        />
      </label>
      <br />
      <label>
        To
        <input
          type={'date'}
          value={toTimestamp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setToTimestamp(e.target.value)
          }
        />
      </label>
      <br />
      <label htmlFor="message-metadata">thread-metadata:</label>
      <input
        id="message-metadata"
        ref={threadMetadataInputRef}
        type="text"
        placeholder={`{ "foo":"bar" }`}
        onChange={updateMetadata}
      />
      <br />
      <label>
        Limit
        <input
          type="number"
          value={limit}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLimit(Number(e.target.value))
          }
        />
      </label>
      <br />
      <label>
        Sort By
        <select
          onChange={(e) =>
            setSortBy(e.target.value as SearchOptionsType['sortBy'])
          }
          value={sortBy}
        >
          {['relevance', 'created_timestamp'].map((sort) => (
            <option key={sort} value={sort}>
              {sort}
            </option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Sort Direction
        <select
          onChange={(e) =>
            setSortDirection(
              e.target.value as SearchOptionsType['sortDirection'],
            )
          }
          value={sortDirection}
        >
          {['ascending', 'descending'].map((sort) => (
            <option key={sort} value={sort}>
              {sort}
            </option>
          ))}
        </select>
      </label>
      <br />
      <br />

      <ol>
        {result?.map((r) => (
          <li key={r.id}>
            <ul style={{ marginBottom: '4px' }}>
              <li>MessageID: {r.id}</li>
              <li>AuthorID: {r.authorID}</li>
              <li>Location: {JSON.stringify(r.location)}</li>
              <li>Metadata: {JSON.stringify(r.metadata)}</li>
              <li>Plaintext: {r.plaintext}</li>
              <li>Created timestamp: {r.createdTimestamp.toString()}</li>
            </ul>
          </li>
        ))}
      </ol>
      {result?.length === 0 && <p>No results found</p>}
    </>
  );
}

function UseMessage({ messageID }: { messageID: string }) {
  const message = thread.useMessage(messageID);

  if (!message) {
    return message === undefined ? (
      <div> loading...</div>
    ) : (
      <div>no message found!</div>
    );
  }
  return (
    <div>
      <ul>
        <li>ID: {message.id}</li>
        <li>Author: {message.authorID}</li>
        <li>Group: {message.groupID}</li>
        <li>Plaintext: {message.plaintext}</li>
        <li>
          Attachments:{' '}
          {`${message.attachments.length} - ${message.attachments
            .map((a) => `${a.type} (${'id' in a && a.id})`)
            .join(', ')}`}
        </li>
      </ul>
      <betaV2.Message message={message} />
    </div>
  );
}

function CustomLiveCursors({
  page,
  allPagesSettingsRef,
  boundingElementRef,
}: {
  page: string;
  allPagesSettingsRef: MutableRefObject<HTMLDivElement | null>;
  boundingElementRef: MutableRefObject<HTMLElement | null>;
}) {
  const viewerData = userHooks.useViewerData();
  return (
    <>
      <LiveCursors
        location={{ page }}
        showViewerCursor={true}
        sendCursor={!viewerData?.metadata.incognito}
        translations={{
          eventToLocation: (e): Location | Promise<Location> => {
            if (
              allPagesSettingsRef?.current &&
              allPagesSettingsRef?.current.contains(e.target as Node)
            ) {
              const clientBoundingRect =
                allPagesSettingsRef?.current.getBoundingClientRect();
              const distanceFromLeft = e.clientX - clientBoundingRect.x;
              const distanceFromTop = e.clientY - clientBoundingRect.y;
              return {
                settingsX: clientBoundingRect.width - distanceFromLeft,
                settingsY: distanceFromTop,
              };
            } else {
              return liveCursorsDefaultEventToLocation(e, {
                send_clicks: false,
              });
            }
          },
          locationToDocument: (location: Location) => {
            if (
              'settingsX' in location &&
              'settingsY' in location &&
              allPagesSettingsRef?.current
            ) {
              const clientBoundingRect =
                allPagesSettingsRef?.current.getBoundingClientRect();
              return {
                viewportX:
                  (location.settingsX as number) + clientBoundingRect.x,
                viewportY:
                  (location.settingsY as number) + clientBoundingRect.y,
                click: false,
              };
            } else {
              return liveCursorsDefaultLocationToDocument(location);
            }
          },
        }}
      />
      <LiveCursors
        location={{ page }}
        showViewerCursor={true}
        sendCursor={!viewerData?.metadata.incognito}
        sendClicks={true}
        showClicks={true}
        boundingElementRef={boundingElementRef}
        cursorComponent={CustomCursor}
      />
    </>
  );
}

const CustomCursor = ({ pos, user }: LiveCursorsCursorProps) => {
  return (
    <LiveCursorsDefaultCursor
      pos={pos}
      user={user}
      className="customCursorClass"
      data-test={user.id}
    />
  );
};

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('container'),
);
