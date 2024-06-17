import 'sdk/client/core/app.css'; // Importing the Reset CSS ASAP so it sits at the top of our generated app.css
// This backwards-compatible CSS allows us to support clients on older version of the SDK, indefinitely.
import 'sdk/client/core/css/LiveCursors-backwards-compatible.css.ts';
import 'sdk/client/core/css/ThreadedComments-backwards-compatible.css.ts';

import { useEffect, StrictMode, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import type { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client';
import type { SubscriptionClient } from 'subscriptions-transport-ws';
import { CordContext } from '@cord-sdk/react';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type {
  ICordSDK,
  CordSDKOptions,
  ScreenshotOptions,
  Location,
  CordSDKInitOptions,
} from '@cord-sdk/types';
import {
  isCaptureScreenshotEvent,
  isAnnotationMode,
  isBlurDisplayLocation,
} from '@cord-sdk/types';
import { UserExporter, UserSDK } from 'sdk/client/core/user.tsx';
import { FloatingThreadsWebComponent } from 'sdk/client/core/components/cord-floating-threads.tsx';
import { InboxLauncherWebComponent } from 'sdk/client/core/components/cord-inbox-launcher.tsx';
import {
  AnnotationSDK,
  AnnotationSDKProvider,
} from 'sdk/client/core/annotations.tsx';
import { API_SERVER_HOST, APP_SERVER_HOST } from 'common/const/Urls.ts';

import { LogLevel } from 'common/types/index.ts';
import { apolloConnection } from 'external/src/common/apolloClient.ts';
import { PagePresenceWebComponent } from 'sdk/client/core/components/cord-page-presence.tsx';
import { PresenceFacepileWebComponent } from 'sdk/client/core/components/cord-presence-facepile.tsx';
import { PresenceObserverWebComponent } from 'sdk/client/core/components/cord-presence-observer.tsx';
import { SidebarWebComponent } from 'sdk/client/core/components/cord-sidebar.tsx';
import { SidebarLauncherWebComponent } from 'sdk/client/core/components/cord-sidebar-launcher.tsx';
import { App } from 'sdk/client/core/app.tsx';
import { PresenceSDK } from 'sdk/client/core/presence.tsx';
import type {
  MonacoEditorInstance,
  ReactTreeInstance,
  ThirdPartyInstances,
} from 'external/src/delegate/annotations/types.ts';
import { MonacoEditors } from 'external/src/delegate/annotations/MonacoEditors.ts';
import { ReactTrees } from 'external/src/delegate/annotations/ReactTrees.ts';
import type { LogEventsMutationVariables } from 'external/src/graphql/operations.ts';
import { LogEventsMutation } from 'external/src/graphql/operations.ts';
import { graphQLRequest } from 'external/src/common/http_api.ts';
import { createLogEvent, sharedMetadata } from 'external/src/logging/common.ts';
import { ThreadWebComponent } from 'sdk/client/core/components/cord-thread.tsx';
import {
  LiveCursorsWebComponent,
  MultipleCursorsWebComponent,
} from 'sdk/client/core/components/cord-live-cursors.tsx';
import { ThreadListWebComponent } from 'sdk/client/core/components/cord-thread-list.tsx';
import type { ICordComponent } from 'sdk/client/core/components/index.tsx';
import { InboxWebComponent } from 'sdk/client/core/components/cord-inbox.tsx';
import {
  accessTokenPayloadsMatch,
  decodeAccessTokenPayload,
} from 'sdk/client/core/util.ts';
import { NotificationListWebComponent } from 'sdk/client/core/components/cord-notification-list.tsx';
import { ActivitySDK } from 'sdk/client/core/activity.tsx';
import { ComposerWebComponent } from 'sdk/client/core/components/cord-composer.tsx';
import { MessageWebComponent } from 'sdk/client/core/components/cord-message.tsx';
import { ThreadSDK } from 'sdk/client/core/thread.tsx';
import { FacepileWebComponent } from 'sdk/client/core/components/cord-facepile.tsx';
import { NotificationListLauncherWebComponent } from 'sdk/client/core/components/cord-notification-list-launcher.tsx';
import type {
  EventName,
  EventPayload,
  LogEventFn,
} from 'external/src/lib/analytics.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { NotificationSDK } from 'sdk/client/core/notification.tsx';
import { BootstrapProvider } from 'external/src/context/bootstrap/BootstrapProvider.tsx';
import { DefaultConfigurationProvider } from 'external/src/context/config/DefaultConfigurationProvider.tsx';
import { DisabledEmbedProvider } from 'external/src/context/embed/EmbedProvider.tsx';
import { LightweightErrorHandler } from 'external/src/logging/LightweightErrorHandler.tsx';
import { PinWebComponent } from 'sdk/client/core/components/cord-pin.tsx';
import { AvatarWebComponent } from 'sdk/client/core/components/cord-avatar.tsx';
import { CordDevTools } from 'sdk/client/core/components/cord-dev-tools.tsx';
import { logDeprecatedCall } from 'sdk/client/core/cordAPILogger.ts';
import { ReactionsWebComponent } from 'sdk/client/core/components/cord-reactions.tsx';
import { NotificationWebComponent } from 'sdk/client/core/components/cord-notification.tsx';
import { MessageContentWebComponent } from 'sdk/client/core/components/cord-message-content.tsx';
import { TimestampWebComponent } from 'sdk/client/core/components/cord-timestamp.tsx';
import { UsersProvider } from 'external/src/context/users/UsersContext.tsx';
import { ThreadedCommentsWebComponent } from 'sdk/client/core/components/cord-threaded-comments.tsx';
import type { CordContextValue } from '@cord-sdk/react';
import { useUnpackClientAuthTokenPayload } from '@cord-sdk/react/hooks/useUnpackClientAuthTokenPayload.ts';
import { i18n } from 'sdk/client/core/i18n.ts';
import { NetworkStatusProvider } from 'external/src/context/network/NetworkStatusContext.tsx';
import { FileSDK } from 'sdk/client/core/file.tsx';
import { convertToInternalScreenshotOptions } from 'external/src/context/config/ConfigurationContext.ts';
import { batchReactUpdates } from 'external/src/lib/util.ts';
import { addTranslations } from '@cord-sdk/react/common/i18n.ts';
import { debounce } from '@cord-sdk/react/common/lib/debounce.ts';

type V2LogType = 'usage' | 'replacement';

let shouldLogLoadingTime = false;
try {
  shouldLogLoadingTime = !!localStorage.getItem('__cord_log_loading_times__');
} catch {
  // localStorage for some reason not available
}

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    part?: string;
  }
}

type LogDeprecationFn = ReturnType<typeof useLogger>['logDeprecation'];

// CordSDKOptions with all the deprecated fields removed
type CleanCordSDKOptions = Omit<
  CordSDKOptions,
  | 'blur_screenshots'
  | 'enable_screenshot_capture'
  | 'show_blurred_screenshots'
  | 'annotation_mode'
> & {
  // Add an additional field so that a CordSDKOptions isn't a valid
  // CleanCordSDKOptions
  clean: true;
};

type RequiredOptions = Required<CleanCordSDKOptions> & {
  screenshot_options: Required<ScreenshotOptions>;
};

const DEFAULT_OPTIONS: RequiredOptions = {
  enable_annotations: true,
  enable_slack: true,
  enable_tasks: true,
  navigate: null,
  thread_options: {
    additional_subscribers_on_create: [],
  },
  screenshot_options: {
    blur: false,
    show_blurred: 'outside_page',
    capture_when: ['new-annotation', 'share-via-email'],
    show_screenshot: true,
  },
  custom_renderers: {},
  custom_event_metadata: {},
  translations: {},
  language: 'en',
  beforeMessageCreate: null,
  clean: true,
};

export type CordInternalCall = {
  // Used to indicate that we're calling a public API from inside a Cord
  // component, so it shouldn't be considered a public call
  __cordInternal?: boolean;
};

export type ComponentCallback = (component: ICordComponent) => unknown;

export interface IPrivateCordSDK extends ICordSDK {
  registerComponent(component: ICordComponent): void;
  unregisterComponent(component: ICordComponent): void;
  logEvent: LogEventFn;
  logDeprecation: LogDeprecationFn;
  setLogEvent(fn: LogEventFn | undefined): void;
  __logV2Component(name: string, what: V2LogType): void;
  __CORD_OPENSOURCE_COMPONENTS: Set<string>;
}
export class CordSDK implements IPrivateCordSDK {
  container = document.createElement('div');
  _presence?: PresenceSDK;
  _annotation = new AnnotationSDK();
  _user?: UserSDK;
  _activity?: ActivitySDK;
  _thread?: ThreadSDK;
  _notification?: NotificationSDK;
  _file?: FileSDK;
  _logEvent?: LogEventFn;
  _pendingEvents: Array<(fn: LogEventFn) => unknown> = [];
  _logDeprecation?: LogDeprecationFn;
  _pendingDeprecations: Array<string> = [];
  apolloClient?: ApolloClient<any>;
  subscriptionClient?: SubscriptionClient;
  accessToken?: string;
  options: RequiredOptions = DEFAULT_OPTIONS;
  thirdPartyInstances: ThirdPartyInstances = {
    monacoEditors: new MonacoEditors(),
    reactTrees: new ReactTrees(),
  };
  components = new Set<ICordComponent>();
  // Will be undefined when not using @cord-sdk.
  npmVersion?: string;
  __CORD_OPENSOURCE_COMPONENTS = new Set<string>();
  __CORD_COMPONENT_REPLACEMENTS = new Set<string>();
  registerComponentCallback?: ComponentCallback;
  unregisterComponentCallback?: ComponentCallback;
  _timestamps: Record<
    'load' | 'init' | 'render' | 'components' | 'componentsEnd',
    number | null
  > = {
    load: performance.now(),
    init: null,
    render: null,
    components: null,
    componentsEnd: null,
  };
  groupID?: string;

  static load() {
    if (!window.CordSDK) {
      const sdk = new CordSDK();
      window.cord = window.CordSDK = sdk;
      sdk.loadCordStylesheet();
      sdk.defineCustomElements();
      window.dispatchEvent(new CustomEvent('cord:load'));
    }
  }

  static get() {
    const sdk = window.CordSDK;
    if (!(sdk instanceof CordSDK)) {
      throw new Error('CordSDK not initialized');
    }
    return sdk;
  }

  public get i18n() {
    return i18n;
  }

  private loadCordStylesheet() {
    // For optimization purpose user our our npm module can inject that style a lot earlier.
    // If it is there, we do not want to re-inject.
    if (document.querySelector('link#cord_css')) {
      return;
    }
    const stylesheetTag = document.createElement('link');
    stylesheetTag.rel = 'stylesheet';
    stylesheetTag.id = 'cord_css';
    stylesheetTag.href = `https://${APP_SERVER_HOST}/sdk/v1/sdk.latest.css`;
    document.head.appendChild(stylesheetTag);
  }

  private defineCustomElements() {
    // NOTE: This should never be called before assigning to window.CordSDK
    this.defineCustomElement(
      'cord-multiple-cursors',
      MultipleCursorsWebComponent,
    );
    this.defineCustomElement('cord-live-cursors', LiveCursorsWebComponent);
    this.defineCustomElement('cord-page-presence', PagePresenceWebComponent);
    this.defineCustomElement(
      'cord-presence-facepile',
      PresenceFacepileWebComponent,
    );
    this.defineCustomElement(
      'cord-presence-observer',
      PresenceObserverWebComponent,
    );
    this.defineCustomElement('cord-sidebar', SidebarWebComponent);
    this.defineCustomElement(
      'cord-sidebar-launcher',
      SidebarLauncherWebComponent,
    );
    this.defineCustomElement('cord-thread', ThreadWebComponent);
    this.defineCustomElement('cord-thread-list', ThreadListWebComponent);
    this.defineCustomElement('cord-composer', ComposerWebComponent);
    this.defineCustomElement('cord-inbox-launcher', InboxLauncherWebComponent);
    this.defineCustomElement('cord-inbox', InboxWebComponent);
    this.defineCustomElement(
      'cord-floating-threads',
      FloatingThreadsWebComponent,
    );
    this.defineCustomElement(
      'cord-notification-list',
      NotificationListWebComponent,
    );
    this.defineCustomElement('cord-message', MessageWebComponent);
    this.defineCustomElement(
      'cord-message-content',
      MessageContentWebComponent,
    );
    this.defineCustomElement('cord-facepile', FacepileWebComponent);
    this.defineCustomElement(
      'cord-notification-list-launcher',
      NotificationListLauncherWebComponent,
    );
    this.defineCustomElement('cord-pin', PinWebComponent);
    this.defineCustomElement('cord-avatar', AvatarWebComponent);
    this.defineCustomElement('cord-dev-tools', CordDevTools);
    this.defineCustomElement('cord-reactions', ReactionsWebComponent);
    this.defineCustomElement('cord-notification', NotificationWebComponent);
    this.defineCustomElement('cord-timestamp', TimestampWebComponent);
    this.defineCustomElement(
      'cord-threaded-comments',
      ThreadedCommentsWebComponent,
    );
  }

  private defineCustomElement(
    name: string,
    constructor: CustomElementConstructor,
  ) {
    if (!window.customElements.get(name)) {
      window.customElements.define(name, constructor);
    }
  }

  // Compares the sdk options passed in against the current sdk options state
  private haveCordOptionsChanged(newOptions: RequiredOptions): boolean {
    if (
      newOptions.enable_tasks !== this.options.enable_tasks ||
      newOptions.enable_annotations !== this.options.enable_annotations ||
      newOptions.enable_slack !== this.options.enable_slack
    ) {
      return true;
    }

    if (
      !isEqual(newOptions.thread_options, this.options.thread_options) ||
      !isEqual(newOptions.translations, this.options.translations) ||
      !isEqual(newOptions.language, this.options.language)
    ) {
      return true;
    }

    if (
      !isEqual(newOptions.screenshot_options, this.options.screenshot_options)
    ) {
      return true;
    }
    if (
      !isEqual(
        newOptions.custom_event_metadata,
        this.options.custom_event_metadata,
      )
    ) {
      return true;
    }

    // comparing functions to their string counterparts because not sure how this
    // can be done otherwise
    if (newOptions.navigate?.toString() !== this.options.navigate?.toString()) {
      return true;
    }
    if (
      newOptions.beforeMessageCreate?.toString() !==
      this.options.beforeMessageCreate?.toString()
    ) {
      return true;
    }

    // Custom Renderers is an object with keys and functions and their values
    // So we check the keys first.
    const newCustomRendererKeys = Object.keys(newOptions.custom_renderers);
    if (
      !isEqual(
        newCustomRendererKeys,
        Object.keys(this.options.custom_renderers),
      )
    ) {
      return true;
    }
    if (newCustomRendererKeys.length > 0) {
      // If keys match, we then stringify the functions and compare
      for (const key in newOptions.custom_renderers) {
        const newCustomRenderer = newOptions.custom_renderers[key];
        const existingCustomRenderer = this.options.custom_renderers[key];

        if (
          newCustomRenderer.toString() !== existingCustomRenderer.toString()
        ) {
          return true;
        }
      }
    }
    return false;
  }

  public async init(options: CordSDKInitOptions) {
    const { client_auth_token, react_package_version, onInitError } = options;
    this.npmVersion = react_package_version;

    if (shouldLogLoadingTime) {
      // eslint-disable-next-line no-console
      console.log(`init(): ${new Date().toISOString()}`);
    }
    this._timestamps.init = performance.now();

    if (!client_auth_token) {
      throw new Error('Missing client_auth_token');
    }

    const newOptions = mergeOptions(
      DEFAULT_OPTIONS,
      checkAndCleanOptions(options),
    );

    // Make sure that calling CordSDK.init with the same arguments won't trigger
    // a re-render.
    if (
      !this.haveCordOptionsChanged(newOptions) &&
      accessTokenPayloadsMatch(this.accessToken, client_auth_token)
    ) {
      console.warn('Initializing CordSDK with the same options');
      return;
    }

    void this.logInit(client_auth_token, react_package_version);

    if (
      !accessTokenPayloadsMatch(this.accessToken, client_auth_token) ||
      !this.apolloClient ||
      !this.subscriptionClient
    ) {
      this.destroy();

      const { apolloClient, subscriptionClient } = apolloConnection({
        token: client_auth_token,
        apiHost: API_SERVER_HOST,
        logGraphQLErrors: true,
        errorCallback: (error) => {
          onInitError?.(error);
        },
      });

      this.accessToken = client_auth_token;
      this.apolloClient = apolloClient;
      this.subscriptionClient = subscriptionClient;
      this._presence = new PresenceSDK(this.apolloClient);
      this._user = new UserSDK(this.apolloClient);
      this._thread = new ThreadSDK(this.apolloClient);
      this._activity = new ActivitySDK(this._thread);
      this._notification = new NotificationSDK(this.apolloClient);
      this._file = new FileSDK(this.apolloClient);
      this.groupID = this.getGroupIDFromTokenIfExists(client_auth_token);
    }

    this.setOptionsAndRender(newOptions);
  }

  public updateOptions(options: CordSDKOptions) {
    const cleanOptions = checkAndCleanOptions(options);

    // Only update the options that were passed, rather than overwriting all the
    // options
    const newOptions = mergeOptions(this.options, cleanOptions);
    this.setOptionsAndRender(newOptions);
  }

  private setOptionsAndRender(options: RequiredOptions) {
    const oldKeys = nonDefaultOptions(this.options);
    const newKeys = nonDefaultOptions(options);
    if (!isEqual(oldKeys, newKeys)) {
      void this.logEvent('sdk-options-used', { options: [...newKeys] });
    }
    this.options = options;

    batchReactUpdates(() => {
      addTranslations(i18n, this.options.translations, this.options.language);
      this.render();
    });
  }

  public destroy() {
    this.apolloClient?.stop();
    this.apolloClient = undefined;
    this.subscriptionClient?.close(true);
    this.subscriptionClient = undefined;
    this.accessToken = undefined;
    this.thirdPartyInstances = {
      monacoEditors: new MonacoEditors(),
      reactTrees: new ReactTrees(),
    };
    this.options = DEFAULT_OPTIONS;
    this.groupID = undefined;

    ReactDOM.unmountComponentAtNode(this.container);
  }

  public addMonacoEditor(id: string, monacoEditor: MonacoEditorInstance) {
    this.thirdPartyInstances.monacoEditors.addMonacoInstance(id, monacoEditor);
    this.render();
  }

  public removeMonacoEditor(id: string) {
    this.thirdPartyInstances.monacoEditors.removeMonacoInstance(id);
    this.render();
  }

  public addReactTree(id: string, reactTree: ReactTreeInstance) {
    this.thirdPartyInstances.reactTrees.addTreeInstance(id, reactTree);
    this.render();
  }

  public removeReactTree(id: string) {
    this.thirdPartyInstances.reactTrees.removeTreeInstance(id);
    this.render();
  }

  private async logInit(clientAuthToken: string, reactPackageVersion?: string) {
    try {
      const payload = decodeAccessTokenPayload(clientAuthToken);
      if (payload === null) {
        throw new Error(
          'Access token does not contain valid payload: ' + clientAuthToken,
        );
      }
      const { app_id, project_id } = payload;

      if (app_id || project_id) {
        await graphQLRequest<any, LogEventsMutationVariables>(
          LogEventsMutation,
          {
            events: [
              createLogEvent(
                'sdk-init',
                LogLevel.DEBUG,
                { appID: project_id ?? app_id, reactPackageVersion },
                sharedMetadata,
              ),
            ],
            _externalOrgID: undefined,
          },
        );
      }
    } catch (e) {
      console.warn('Failed to log sdk-init', e);
    }
  }

  public toggleDevTools() {
    const existingDevTools = document.getElementsByTagName('cord-dev-tools')[0];
    if (existingDevTools instanceof HTMLElement) {
      existingDevTools.remove();
    } else {
      document.body.appendChild(document.createElement('cord-dev-tools'));
    }
  }

  public get presence() {
    if (!this._presence) {
      throw new Error('Cord SDK not yet initialized.');
    }
    return this._presence;
  }

  /**
   * @deprecated Renamed to annotation.
   */
  public get annotations() {
    logDeprecatedCall('CordSDK get annotations');
    return this.annotation;
  }

  public get annotation() {
    if (!this._annotation) {
      throw new Error('Cord SDK not yet initialized.');
    }
    return this._annotation;
  }

  /**
   * @deprecated Renamed to user.
   */
  public get users() {
    return this.user;
  }

  public get user() {
    if (!this._user) {
      throw new Error('Cord SDK not yet initialized.');
    }
    return this._user;
  }

  public get activity() {
    if (!this._activity) {
      throw new Error('Cord SDK not yet initialized.');
    }
    return this._activity;
  }

  public get thread() {
    if (!this._thread) {
      throw new Error('Cord SDK not yet initialized.');
    }
    return this._thread;
  }

  public get notification() {
    if (!this._notification) {
      throw new Error('Cord SDK not yet initialized.');
    }
    return this._notification;
  }

  public get file() {
    if (!this._file) {
      throw new Error('Cord SDK not yet initialized.');
    }
    return this._file;
  }

  public get experimental() {
    return {};
  }

  registerComponent(component: ICordComponent) {
    this.components.add(component);
    this.registerComponentCallback?.(component);
  }

  unregisterComponent(component: ICordComponent) {
    this.components.delete(component);
    this.unregisterComponentCallback?.(component);
  }

  async logEvent<E extends EventName>(
    eventName: E,
    ...args: EventPayload<E> extends never ? [] : [EventPayload<E>]
  ) {
    if (this._logEvent) {
      return this._logEvent(eventName, ...args);
    } else {
      // We queue a function rather than just storing the arguments because
      // LogEventFn takes a variable number of arguments and if we just stash
      // the args it's hard to get TS to be sure that we're calling it
      // correctly.  If we call it from here, though, we know eventName and args
      // go together properly.
      return await new Promise<void>((resolve) =>
        this._pendingEvents.push((fn: LogEventFn) => {
          fn(eventName, ...args);
          resolve();
        }),
      );
    }
  }

  async logDeprecation(key: string) {
    if (this._logDeprecation) {
      this._logDeprecation(key);
    } else {
      this._pendingDeprecations.push(key);
    }
  }

  setLogEvent(fn: LogEventFn | undefined) {
    this._logEvent = fn;
    if (this._logEvent) {
      while (this._pendingEvents.length > 0) {
        const logFn = this._pendingEvents.shift()!;
        logFn(this._logEvent);
      }
    }
  }

  setLogDeprecation(fn: LogDeprecationFn | undefined) {
    this._logDeprecation = fn;
    if (this._logDeprecation) {
      while (this._pendingDeprecations.length > 0) {
        this._logDeprecation(this._pendingDeprecations.shift()!);
      }
    }
  }

  private getGroupIDFromTokenIfExists(clientAuthToken: string) {
    const payload = decodeAccessTokenPayload(clientAuthToken);
    let groupID: string | undefined = undefined;

    if (!payload) {
      return groupID;
    }

    if (
      'organization_id' in payload &&
      (typeof payload['organization_id'] === 'string' ||
        typeof payload['organization_id'] === 'number')
    ) {
      groupID = payload['organization_id'].toString();
    }
    if (
      'group_id' in payload &&
      (typeof payload['group_id'] === 'string' ||
        typeof payload['group_id'] === 'number')
    ) {
      groupID = payload['group_id'].toString();
    }

    return groupID;
  }

  private v2ComponentsToLog = {
    usage: new Set<string>(),
    replacement: new Set<string>(),
  };
  private alreadyLoggedV2Components = {
    usage: new Set<string>(),
    replacement: new Set<string>(),
  };
  private logAllV2Components = debounce(500, (what: V2LogType) => {
    if (this.v2ComponentsToLog[what].size < 1) {
      return;
    }
    void this.logEvent(`opensource-component-${what}`, {
      components: [...this.v2ComponentsToLog[what]],
      version: 'v2',
    });
    this.v2ComponentsToLog[what].clear();
  });

  public __logV2Component(name: string, what: V2LogType) {
    if (
      this.alreadyLoggedV2Components[what].has(name) ||
      this.v2ComponentsToLog[what].has(name)
    ) {
      return;
    }
    this.v2ComponentsToLog[what].add(name);
    this.alreadyLoggedV2Components[what].add(name);
    this.logAllV2Components(what);
  }

  private render() {
    if (!this.apolloClient || !this.accessToken) {
      // don't render anything unless we've initialized
      return;
    }

    this._timestamps.render = performance.now();

    ReactDOM.render(
      <StrictMode>
        <CordProviderShim sdk={this} clientAuthToken={this.accessToken}>
          <ApolloProvider client={this.apolloClient}>
            <NetworkStatusProvider subscriptionClient={this.subscriptionClient}>
              <AnnotationSDKProvider annotationSDK={this.annotation}>
                <LightweightErrorHandler>
                  <DisabledEmbedProvider>
                    <UsersProvider>
                      <BootstrapProvider>
                        <DefaultConfigurationProvider>
                          <App
                            thirdPartyInstances={this.thirdPartyInstances}
                            enableTasks={this.options.enable_tasks}
                            enableAnnotations={this.options.enable_annotations}
                            enableSlack={this.options.enable_slack}
                            navigate={this.options.navigate}
                            beforeMessageCreate={
                              this.options.beforeMessageCreate
                            }
                            threadOptions={this.options.thread_options}
                            screenshotOptions={convertToInternalScreenshotOptions(
                              this.options.screenshot_options,
                            )}
                            customRenderers={this.options.custom_renderers}
                            initialComponents={[...this.components]}
                            customEventMetadata={
                              this.options.custom_event_metadata
                            }
                            // we need to expose a way for external (non-React) code to affect
                            // the state of a React component, so I'm passing a callback that
                            // will be called by the component once it has a state-connected setter
                            // function, to remember it here.
                            setRegisterComponentCallback={(
                              registerComponentCallback,
                            ) => {
                              this.registerComponentCallback =
                                registerComponentCallback;
                              for (const component of this.components) {
                                registerComponentCallback?.(component);
                              }
                            }}
                            setUnregisterComponentCallback={(
                              unregisterComponentCallback,
                            ) => {
                              this.unregisterComponentCallback =
                                unregisterComponentCallback;
                            }}
                          >
                            <LogEventExporter />
                            <UserExporter users={this.user} />
                            <this.user._OrgMemberExporterElement />
                            <this.thread._ThreadExporterElement />
                            <this.thread._ThreadsExporterElement />
                            <this.thread._LocationDataExporterElement />
                            <this.thread._MessageDataExporterElement />
                            <this.notification._NotificationDataExporterElement />
                            <this.notification._NotificationMutationsExporterElement />
                            <this.thread._ThreadMutationsExporterElement />
                          </App>
                        </DefaultConfigurationProvider>
                      </BootstrapProvider>
                    </UsersProvider>
                  </DisabledEmbedProvider>
                </LightweightErrorHandler>
              </AnnotationSDKProvider>
            </NetworkStatusProvider>
          </ApolloProvider>
        </CordProviderShim>
      </StrictMode>,
      this.container,
    );
  }
}

function CordProviderShim({
  sdk,
  clientAuthToken,
  children,
}: React.PropsWithChildren<{ sdk: ICordSDK; clientAuthToken: string }>) {
  const [location, setLocation] = useState<Location>();
  const { userID, organizationID } =
    useUnpackClientAuthTokenPayload(clientAuthToken);

  const val: CordContextValue = useMemo(
    () => ({
      sdk,
      i18n: sdk.i18n,
      location,
      setLocation,
      hasProvider: true,
      clientAuthToken,
      userID,
      organizationID,
    }),
    [clientAuthToken, location, organizationID, sdk, userID],
  );

  return <CordContext.Provider value={val}>{children}</CordContext.Provider>;
}

function LogEventExporter() {
  const { logEvent, logDeprecation } = useLogger();
  useEffect(() => {
    CordSDK.get().setLogEvent(logEvent);
    CordSDK.get().setLogDeprecation(logDeprecation);
  }, [logEvent, logDeprecation]);
  return null;
}

function mergeOptions(
  previousOptions: RequiredOptions,
  newOptions: CleanCordSDKOptions,
) {
  return {
    ...previousOptions,
    ...removeUndefined(newOptions),
    screenshot_options: {
      ...previousOptions.screenshot_options,
      ...removeUndefined(newOptions?.screenshot_options ?? {}),
    },
  };
}

// Sometimes we get values without a key and sometimes we get them with the key
// but set to `undefined`.  To make the merge right, we want to treat those both
// as not overwriting, so remove all the keys that are set to undefined.
function removeUndefined<T extends Record<string, any>>(a: T): T {
  const result: T = {} as T;
  let k: keyof T;
  for (k of Object.keys(a)) {
    if (a[k] !== undefined) {
      result[k] = a[k];
    }
  }
  return result;
}

function generateScreenshotOptions(options: CordSDKOptions): ScreenshotOptions {
  return {
    blur: options.screenshot_options?.blur ?? options.blur_screenshots,
    capture_when:
      options.screenshot_options?.capture_when ??
      (options.enable_screenshot_capture === false ? [] : undefined),
    show_blurred:
      options.screenshot_options?.show_blurred ??
      options.show_blurred_screenshots,
    show_screenshot: options.screenshot_options?.show_screenshot,
  };
}

function nonDefaultOptions(options: RequiredOptions): Set<string> {
  const result = new Set<string>();
  let k: keyof RequiredOptions;
  for (k in options) {
    if (k === 'screenshot_options') {
      // Check each screenshot option separately
      let k2: keyof RequiredOptions['screenshot_options'];
      for (k2 in options.screenshot_options) {
        if (
          !isEqual(
            options.screenshot_options[k2],
            DEFAULT_OPTIONS.screenshot_options[k2],
          )
        ) {
          result.add(`screenshot_options.${k2}`);
        }
      }
    } else if (!isEqual(options[k], DEFAULT_OPTIONS[k])) {
      result.add(k);
    }
  }
  return result;
}

function checkAndCleanOptions(options: CordSDKOptions): CleanCordSDKOptions {
  // Pass through all the options that don't need backwards compatibility
  // handling
  const result: CleanCordSDKOptions = {
    enable_slack: options.enable_slack,
    enable_tasks: options.enable_tasks,
    navigate: options.navigate,
    beforeMessageCreate: options.beforeMessageCreate,
    thread_options: options.thread_options,
    custom_renderers: options.custom_renderers,
    custom_event_metadata: options.custom_event_metadata,
    translations: options.translations,
    language: options.language,
    clean: true,
  };
  if (
    options.show_blurred_screenshots &&
    !isBlurDisplayLocation(options.show_blurred_screenshots)
  ) {
    throw new Error('Invalid setting for show_blurred_screenshots');
  }
  if (options.annotation_mode && !isAnnotationMode(options.annotation_mode)) {
    throw new Error('Invalid value for annotation_mode');
  }
  if (
    options.screenshot_options?.capture_when &&
    (!Array.isArray(options.screenshot_options.capture_when) ||
      (options.screenshot_options.capture_when.length > 0 &&
        !options.screenshot_options.capture_when.every((captureWhen) =>
          isCaptureScreenshotEvent(captureWhen),
        )))
  ) {
    throw new Error('Invalid value for screenshot_options.capture_when');
  }

  result.screenshot_options = generateScreenshotOptions(options);

  // If the client is not yet using annotation_mode, but still has enable_annotations
  // set, we will honor the value they have there
  if (
    options.enable_annotations === undefined &&
    options.annotation_mode !== undefined
  ) {
    result.enable_annotations = options.annotation_mode !== 'none';
  } else {
    result.enable_annotations = options.enable_annotations;
  }
  return result;
}
