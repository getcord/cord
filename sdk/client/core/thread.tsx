import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { ApolloClient, ObservableSubscription } from '@apollo/client';
import type {
  ICordThreadSDK,
  ListenerRef,
  ObserveThreadSummaryOptions,
  ThreadActivitySummary,
  ThreadActivitySummaryUpdateCallback,
  ThreadSummaryUpdateCallback,
  Location,
  ObserveThreadActivitySummaryOptions,
  ThreadDataCallback,
  ObserveThreadDataOptions,
  LocationDataCallback,
  ObserveLocationDataOptions,
  ClientUpdateThread,
  ClientCreateMessage,
  ClientUpdateMessage,
  SearchResultData,
  TimestampRange,
  ObserveThreadCountsOptions,
  ObserveThreadsOptions,
  ResolvedStatus,
  ThreadObserverOptions,
  ThreadCallback,
  ThreadSummary,
  MessageID,
  MessageCallback,
  ThreadsCallback,
  EntityMetadata,
  ClientCreateThread,
  SortDirection,
  SearchSortByOptions,
  ClientThreadFilter,
  ShareThreadOptions,
} from '@cord-sdk/types';
import {
  logApiCall,
  logDeprecatedCall,
} from 'sdk/client/core/cordAPILogger.ts';
import { useThreadByExternalID } from 'external/src/context/threads2/useThreadByExternalID.ts';
import {
  makeGenericExporter,
  makeSingletonExporter,
} from 'sdk/client/core/genericExporter.tsx';
import type {
  ThreadData,
  ThreadsContextType,
  ThreadsDataContextType,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import {
  ThreadsDataContext2,
  ThreadsContext2,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import {
  UpdateThreadByExternalIDMutation,
  ThreadActivityQuery,
  ThreadActivitySummarySubscription,
  CreateMessageByExternalIDMutation,
  SetSubscribedByExternalIDMutation,
  UpdateMessageByExternalIDMutation,
  MessageContentSearchQuery,
  CreateThreadMutation,
  MarkThreadsSeenMutation,
  ShareThreadToEmailMutation,
  AddThreadToSlackChannelMutation,
} from 'external/src/graphql/operations.ts';
import type {
  ThreadActivitySummaryFragment,
  ThreadActivityQueryResult,
  ThreadActivityQueryVariables,
  ThreadActivitySummarySubscriptionResult,
  ThreadActivitySummarySubscriptionVariables,
  PageContextInput,
  SetSubscribedByExternalIDMutationResult,
  SetSubscribedByExternalIDMutationVariables,
  UpdateThreadByExternalIDMutationVariables,
  UpdateThreadByExternalIDMutationResult,
  CreateMessageByExternalIDMutationResult,
  CreateMessageByExternalIDMutationVariables,
  UpdateMessageByExternalIDMutationResult,
  UpdateMessageByExternalIDMutationVariables,
  MessageContentSearchQueryResult,
  MessageContentSearchQueryVariables,
  CreateThreadMutationResult,
  CreateThreadMutationVariables,
  MarkThreadsSeenMutationVariables,
  MarkThreadsSeenMutationResult,
  ShareThreadToEmailMutationResult,
  ShareThreadToEmailMutationVariables,
  AddThreadToSlackChannelMutationResult,
  AddThreadToSlackChannelMutationVariables,
  MessageFragment,
} from 'external/src/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useGetThreadIDsOnPage } from 'sdk/client/core/react/useGetThreadIDsOnPage.ts';
import { useGetThreadCounts } from 'sdk/client/core/react/useGetThreadCounts.ts';
import {
  getLocationFilter,
  getResolvedFromStatus,
  getViewerThreadFilter,
} from 'common/types/index.ts';
import {
  ExternalizedCache,
  convertDateObjectIntoISOString,
  handleSuccessResult,
} from 'sdk/client/core/util.ts';
import type { UserContextType } from 'external/src/context/users/UsersContext.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import {
  getMessageData,
  getThreadSummary,
} from 'common/util/convertToExternal/thread.ts';
import { OrgOverrideProvider } from 'external/src/context/organization/OrganizationContext.tsx';
import { useMessageByExternalID } from 'sdk/client/core/react/useMessageByExternalId.tsx';
import { useMemoObject } from '@cord-sdk/react/hooks/useMemoObject.ts';
import { useReffedFn } from '@cord-sdk/react/hooks/useReffedFn.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';
import {
  DEFAULT_THREAD_INITIAL_PAGE_SIZE,
  INITIAL_MESSAGES_COUNT,
  THREAD_INITIAL_PAGE_SIZE_LIMIT,
} from 'common/const/Api.ts';
import { captureScreenshot } from 'external/src/lib/screenshot.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { ScreenshotConfigContext } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFileUploader } from 'external/src/effects/useFileUploader.ts';
import { CordSDK } from 'sdk/client/core/index.tsx';
import { externalThreadMatchesFilter } from 'sdk/client/core/filter.ts';
import { isDefined } from 'common/util/index.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { useConstant } from 'external/src/effects/useConstant.ts';

const THREAD_SDK_MODULE_NAME = 'thread';

type ThreadCountsListenerState = {
  callback: ThreadActivitySummaryUpdateCallback;
  summary: ThreadActivitySummary | undefined;
  subscription: ObservableSubscription;
};

type LocationDataListenerState = {
  location: Location;
  callback: LocationDataCallback;
  options: ObserveLocationDataOptions;
};

type ThreadsListenerState = {
  callback: ThreadsCallback;
  options: ObserveThreadsOptions;
};

type ThreadListenerState = {
  callback: ThreadCallback;
  externalThreadID: string;
  options: ThreadObserverOptions;
};

type MessageDataListenerState = {
  externalMessageID: string;
  callback: MessageCallback;
};

const isDifferentSummary = (
  a: ThreadActivitySummary | undefined,
  b: ThreadActivitySummary,
): boolean =>
  a?.total !== b.total || a?.unread !== b.unread || a?.resolved !== b.resolved;

type CaptureScreenshot = {
  screenshotId: string;
  blurredScreenshotId: string | null;
};

type ThreadMutationFunctions = {
  markThreadsSeenLocally: ThreadsContextType['markThreadsSeenLocally'];
  getThreadByExternalID: ThreadsContextType['getThreadByExternalID'];
  userByID: UserContextType['byInternalID']['userByID'];
  setSubscribed: ThreadsContextType['setSubscribed'];
  captureScreenshotFn: () => Promise<CaptureScreenshot | null>;
  mergeOptimisticMessage: ThreadsContextType['mergeOptimisticMessage'];
};

export class ThreadSDK implements ICordThreadSDK {
  private _threadExporter = makeGenericExporter(ThreadReporter);
  private _ThreadsExporter = makeGenericExporter(ThreadsReporter);
  private _locationDataExporter = makeGenericExporter(LocationDataReporter);
  private _messageDataExporter = makeGenericExporter(MessageDataReporter);
  private _mutationFunctionsExporter = makeSingletonExporter(
    useThreadMutationFunctions,
  );

  private _threadCountsListeners = new Map<
    ListenerRef,
    ThreadCountsListenerState
  >();
  private _threadCountsListenerKey = 0;

  constructor(private apolloClient: ApolloClient<any>) {}

  observeThreadSummary(
    id: string,
    callback: ThreadSummaryUpdateCallback,
    options: ObserveThreadSummaryOptions = {},
  ): ListenerRef {
    logApiCall(THREAD_SDK_MODULE_NAME, 'observeThreadSummary');
    logDeprecatedCall('thread.observeThreadSummary');
    return this.observeThread(
      id,
      ({ summary }) => summary && callback(summary),
      options,
    );
  }

  unobserveThreadSummary(ref: ListenerRef): boolean {
    return this.unobserveThread(ref);
  }

  observeThreadData(
    threadId: string,
    callback: ThreadDataCallback,
    options: ObserveThreadDataOptions = {},
  ): ListenerRef {
    logApiCall(THREAD_SDK_MODULE_NAME, 'observeThreadData');
    logDeprecatedCall('thread.observeThreadData');
    return this.observeThread(
      threadId,
      (data) =>
        callback({
          hasMore: data.hasMore,
          fetchMore: data.fetchMore,
          loading: data.loading,
          messages: data.messages,
          firstMessage: data.summary?.firstMessage ?? null,
        }),
      options,
    );
  }

  unobserveThreadData(ref: ListenerRef): boolean {
    return this.unobserveThread(ref);
  }

  observeThread(
    threadID: string,
    callback: ThreadCallback,
    options: ThreadObserverOptions = {},
  ): ListenerRef {
    logApiCall(THREAD_SDK_MODULE_NAME, 'observeThread');
    if (isDefined(options.initialFetchCount)) {
      const value = Number(options.initialFetchCount);
      if (isNaN(value) || value <= 0) {
        throw new Error('initialFetchCount must be a positive number');
      }
    }
    if (options.location) {
      logDeprecatedCall('ThreadReporter options.location');
    }
    if (options.threadName) {
      logDeprecatedCall('ThreadReporter options.threadName');
    }
    if (options.groupID) {
      logDeprecatedCall('ThreadReporter options.groupID');
    }
    return this._threadExporter.observe({
      callback,
      externalThreadID: threadID,
      options,
    });
  }

  unobserveThread(ref: ListenerRef): boolean {
    return this._threadExporter.unobserve(ref);
  }

  get _ThreadExporterElement() {
    return this._threadExporter.Element;
  }

  observeLocationSummary(
    location: Location,
    callback: ThreadActivitySummaryUpdateCallback,
    options: ObserveThreadActivitySummaryOptions = {},
  ): ListenerRef {
    logApiCall(THREAD_SDK_MODULE_NAME, 'observeLocationSummary');
    logDeprecatedCall('thread.observeLocationSummary');

    return this.observeThreadCounts(callback, {
      filter: {
        ...options.filter,
        resolvedStatus: 'any',
        location: {
          value: location,
          partialMatch: !!options.partialMatch,
        },
      },
    });
  }

  unobserveLocationSummary(ref: ListenerRef): boolean {
    return this.unobserveThreadCounts(ref);
  }

  observeThreadCounts(
    callback: ThreadActivitySummaryUpdateCallback,
    options: ObserveThreadCountsOptions = {},
  ): ListenerRef {
    logApiCall(THREAD_SDK_MODULE_NAME, 'observeThreadCounts');
    const key = this._threadCountsListenerKey++;

    const onResponse = (activity: ThreadActivitySummaryFragment) => {
      const record = this._threadCountsListeners.get(key);
      if (!record) {
        return;
      }

      const summary: ThreadActivitySummary = {
        total: activity.totalThreadCount,
        unread: activity.unreadThreadCount,
        new: activity.newThreadCount,
        unreadSubscribed: activity.unreadSubscribedThreadCount,
        resolved: activity.resolvedThreadCount,
        empty: activity.emptyThreadCount,
      };

      if (isDifferentSummary(record.summary, summary)) {
        record.summary = summary;
        record.callback(summary);
      }
    };

    const { metadata, location, resolvedStatus, groupID, viewer, ...rest } =
      options.filter ?? {};
    const _: Record<string, never> = rest;

    const locationFilter = getLocationFilter(location);
    const resolved = getResolvedFromStatus(
      // we default to 'any' to make sure we're returning all the data by default then
      // let developers add the restrictions
      resolvedStatus ?? 'any',
    );
    const viewerFilter = getViewerThreadFilter(viewer);

    // TODO: is there a common function for this?
    let pageContext: PageContextInput | undefined;
    if (locationFilter) {
      pageContext = {
        providerID: undefined,
        data: locationFilter.value,
      };
    }

    this.apolloClient
      .query<ThreadActivityQueryResult, ThreadActivityQueryVariables>({
        query: ThreadActivityQuery,
        variables: {
          pageContext,
          partialMatch: !!locationFilter?.partialMatch,
          metadata,
          viewer: viewerFilter,
          resolved,
          _externalOrgID: groupID,
        },
      })
      .then(
        ({ data }) => onResponse(data.activity.threadSummary),
        (e) => console.error('Error fetching location summary', e),
      );

    const subscription = this.apolloClient
      .subscribe<
        ThreadActivitySummarySubscriptionResult,
        ThreadActivitySummarySubscriptionVariables
      >({
        query: ThreadActivitySummarySubscription,
        variables: {
          pageContext,
          partialMatch: !!locationFilter?.partialMatch,
          metadata,
          viewer: viewerFilter,
          resolved,
          _externalOrgID: groupID,
        },
      })
      .subscribe(({ data }) => {
        if (data) {
          onResponse(data.threadActivitySummary);
        }
      });

    this._threadCountsListeners.set(key, {
      callback,
      subscription,
      summary: undefined,
    });

    return key;
  }

  unobserveThreadCounts(ref: ListenerRef): boolean {
    const record = this._threadCountsListeners.get(ref);
    if (!record) {
      return false;
    }

    record.subscription.unsubscribe();
    this._threadCountsListeners.delete(ref);

    return true;
  }

  observeLocationData(
    location: Location,
    callback: LocationDataCallback,
    options: ObserveLocationDataOptions = {},
  ): ListenerRef {
    logApiCall(THREAD_SDK_MODULE_NAME, 'observeLocationData');
    return this._locationDataExporter.observe({ location, callback, options });
  }

  unobserveLocationData(ref: ListenerRef): boolean {
    return this._locationDataExporter.unobserve(ref);
  }

  observeMessage(messageID: MessageID, callback: MessageCallback): ListenerRef {
    logApiCall(THREAD_SDK_MODULE_NAME, 'observeMessage');
    return this._messageDataExporter.observe({
      externalMessageID: messageID,
      callback,
    });
  }
  unobserveMessage(ref: ListenerRef): boolean {
    return this._messageDataExporter.unobserve(ref);
  }

  get _MessageDataExporterElement() {
    return this._messageDataExporter.Element;
  }

  observeThreads(
    callback: ThreadsCallback,
    options: ObserveThreadsOptions = {},
  ): ListenerRef {
    logApiCall(THREAD_SDK_MODULE_NAME, 'observeThreads');
    return this._ThreadsExporter.observe({ callback, options });
  }

  unobserveThreads(ref: ListenerRef): boolean {
    return this._ThreadsExporter.unobserve(ref);
  }

  async createThread(data?: ClientCreateThread): Promise<true> {
    logApiCall(THREAD_SDK_MODULE_NAME, 'createThread');
    if (!data) {
      throw new Error('Missing thread data');
    }
    const {
      id: externalThreadID,
      location,
      name,
      url,
      metadata,
      extraClassnames,
      groupID,
      addSubscribers,
      ...rest
    } = data;
    // Check that all properties in ClientCreateThread are destructured
    const _: Record<string, never> = rest;

    return handleSuccessResult(
      (
        await this.apolloClient.mutate<
          CreateThreadMutationResult,
          CreateThreadMutationVariables
        >({
          mutation: CreateThreadMutation,
          variables: {
            externalThreadID,
            input: {
              location,
              name,
              url,
              metadata,
              extraClassnames,
              addSubscribers,
            },
            _externalOrgID: groupID,
          },
        })
      ).data?.createThread,
    );
  }

  async updateThread(
    threadID: string,
    data: ClientUpdateThread,
  ): Promise<true> {
    logApiCall(THREAD_SDK_MODULE_NAME, 'updateThread');
    return handleSuccessResult(
      (
        await this.apolloClient.mutate<
          UpdateThreadByExternalIDMutationResult,
          UpdateThreadByExternalIDMutationVariables
        >({
          mutation: UpdateThreadByExternalIDMutation,
          variables: {
            externalThreadID: threadID,
            url: data.url,
            name: data.name,
            metadata: data.metadata,
            resolved: data.resolved,
            extraClassnames: data.extraClassnames,
            typing: data.typing,
          },
        })
      ).data?.updateThreadByExternalID,
    );
  }

  async sendMessage(
    threadID: string,
    data: ClientCreateMessage,
  ): Promise<true> {
    logApiCall(THREAD_SDK_MODULE_NAME, 'sendMessage');
    const {
      id,
      content,
      url,
      addReactions,
      metadata,
      iconURL,
      translationKey,
      extraClassnames,
      createThread,
      addAttachments = [],
      addScreenshot,
      skipLinkPreviews,
      subscribeToThread,
      ...rest
    } = data;
    // Check that all properties in ClientCreateMessage are destructured
    const _: Record<string, never> = rest;

    const internalMessageID = uuid();

    const { mergeOptimisticMessage, captureScreenshotFn } =
      await this._mutationFunctionsExporter.get();
    const undoOptimisticMerge = mergeOptimisticMessage(
      threadID,
      internalMessageID,
      data,
    );

    const screenshotCapture = addScreenshot
      ? await captureScreenshotFn()
      : null;

    // TODO(flooey): Add more verification here so we can throw errors early
    // rather than relying on them coming from the GraphQL mutation
    try {
      return handleSuccessResult(
        (
          await this.apolloClient.mutate<
            CreateMessageByExternalIDMutationResult,
            CreateMessageByExternalIDMutationVariables
          >({
            mutation: CreateMessageByExternalIDMutation,
            variables: {
              input: {
                externalMessageID: id,
                externalThreadID: threadID,
                messageID: internalMessageID,
                content,
                type: undefined,
                url: url,
                addReactions: addReactions,
                metadata: metadata,
                iconURL: iconURL,
                translationKey,
                extraClassnames: extraClassnames,
                createThread: createThread
                  ? {
                      location: createThread.location,
                      url: createThread.url,
                      name: createThread.name,
                      metadata: createThread.metadata,
                      extraClassnames: createThread.extraClassnames,
                      addSubscribers: createThread.addSubscribers,
                    }
                  : undefined,
                addFileAttachments: addAttachments
                  .filter((a) => a.type === 'file')
                  .map((a) => a.id),
                screenshotAttachment: screenshotCapture
                  ? {
                      id: uuid(),
                      screenshotFileID: screenshotCapture.screenshotId,
                      blurredScreenshotFileID:
                        screenshotCapture.blurredScreenshotId,
                    }
                  : undefined,
                skipLinkPreviews: skipLinkPreviews,
                subscribeToThread,
              },
              _externalOrgID: createThread?.groupID,
            },
          })
        ).data?.createMessageByExternalID,
      );
    } catch (e) {
      undoOptimisticMerge();
      throw e;
    }
  }

  async updateMessage(
    messageID: string,
    data: ClientUpdateMessage,
  ): Promise<true>;
  async updateMessage(
    threadID: string,
    messageID: string,
    data: ClientUpdateMessage,
  ): Promise<true>;
  async updateMessage(
    threadOrMessageID: string,
    messageIDOrUpdateMessageData: string | ClientUpdateMessage,
    data?: ClientUpdateMessage,
  ): Promise<true> {
    logApiCall(THREAD_SDK_MODULE_NAME, 'updateMessage');
    let threadID: string | undefined;
    let messageID: string | undefined;
    let updateMessageData: ClientUpdateMessage | undefined = undefined;

    if (
      typeof messageIDOrUpdateMessageData === 'string' &&
      data !== undefined
    ) {
      logDeprecatedCall('thread.updateMessage');
      threadID = threadOrMessageID;
      messageID = messageIDOrUpdateMessageData;
      updateMessageData = data;
    } else if (typeof messageIDOrUpdateMessageData === 'object') {
      messageID = threadOrMessageID;
      updateMessageData = messageIDOrUpdateMessageData;
    } else {
      throw new Error('Invalid arguments, need a message ID and data');
    }

    const {
      content,
      url,
      metadata,
      iconURL,
      translationKey,
      extraClassnames,
      deleted,
      addReactions,
      removeReactions,
      addAttachments,
      removeAttachments,
      skipLinkPreviews,
      ...rest
    } = updateMessageData;
    // Check that all properties in ClientUpdateMessage are destructured
    const _: Record<string, never> = rest;

    // TODO(flooey): Add more verification here so we can throw errors early
    // rather than relying on them coming from the GraphQL mutation
    return handleSuccessResult(
      (
        await this.apolloClient.mutate<
          UpdateMessageByExternalIDMutationResult,
          UpdateMessageByExternalIDMutationVariables
        >({
          mutation: UpdateMessageByExternalIDMutation,
          variables: {
            input: {
              externalMessageID: messageID,
              externalThreadID: threadID,
              content,
              type: undefined,
              url: url,
              metadata: metadata,
              iconURL: iconURL,
              translationKey,
              extraClassnames: extraClassnames,
              deleted: deleted,
              addReactions: addReactions,
              removeReactions: removeReactions,
              addFileAttachments: addAttachments
                ?.filter((a) => a.type === 'file')
                .map((a) => a.id),
              removeFileAttachments: removeAttachments
                ?.filter((a) => a.type === 'file')
                .map((a) => a.id),
              skipLinkPreviews: skipLinkPreviews,
              removePreviewLinks: removeAttachments
                ?.filter((a) => a.type === 'link_preview')
                .map((a) => a.id),
            },
          },
        })
      ).data?.updateMessageByExternalID,
    );
  }

  async shareThread(
    threadID: string,
    options: ShareThreadOptions,
  ): Promise<true> {
    logApiCall(THREAD_SDK_MODULE_NAME, 'shareThread');
    const sdk = CordSDK.get();
    const mutationFunctions = await this._mutationFunctionsExporter.get();
    if (options.method !== 'email' && options.method !== 'slack') {
      throw new Error('Method should be email or slack');
    }

    switch (options.method) {
      case 'email': {
        let captureData: CaptureScreenshot | null = null;
        if (
          sdk.options.screenshot_options.capture_when.includes(
            'share-via-email',
          )
        ) {
          captureData = await mutationFunctions.captureScreenshotFn();
        }
        const screenshotID =
          captureData?.blurredScreenshotId ?? captureData?.screenshotId ?? null;

        return handleSuccessResult(
          (
            await this.apolloClient.mutate<
              ShareThreadToEmailMutationResult,
              ShareThreadToEmailMutationVariables
            >({
              mutation: ShareThreadToEmailMutation,
              variables: {
                threadID,
                email: options.email,
                screenshotID,
                byExternalID: true,
              },
            })
          ).data?.shareThreadToEmail,
        );
      }
      case 'slack': {
        return handleSuccessResult(
          (
            await this.apolloClient.mutate<
              AddThreadToSlackChannelMutationResult,
              AddThreadToSlackChannelMutationVariables
            >({
              mutation: AddThreadToSlackChannelMutation,
              variables: {
                threadID,
                installBot: true,
                slackChannelID: options.channelID,
                byExternalID: true,
              },
            })
          ).data?.addThreadToSlackChannel,
        );
      }
    }
  }

  get _ThreadsExporterElement() {
    return this._ThreadsExporter.Element;
  }

  get _LocationDataExporterElement() {
    return this._locationDataExporter.Element;
  }

  async setSubscribed(threadID: string, subscribed: boolean): Promise<true> {
    logApiCall(THREAD_SDK_MODULE_NAME, 'setSubscribed');

    const mutationFunctions = await this._mutationFunctionsExporter.get();
    const thread = mutationFunctions.getThreadByExternalID(threadID);
    if (thread) {
      // To make sure if the thread is within the UI we update the state of
      // the subscribe/unsubscribe button to match
      mutationFunctions.setSubscribed(thread.id, subscribed);
    }

    return handleSuccessResult(
      (
        await this.apolloClient.mutate<
          SetSubscribedByExternalIDMutationResult,
          SetSubscribedByExternalIDMutationVariables
        >({
          mutation: SetSubscribedByExternalIDMutation,
          variables: {
            externalID: threadID,
            subscribed,
          },
        })
      ).data?.setSubscribedByExternalID,
    );
  }

  async setSeen(
    idOrFilter: string | ClientThreadFilter,
    seen: boolean,
  ): Promise<true> {
    logApiCall(THREAD_SDK_MODULE_NAME, 'setSeen');

    if (typeof idOrFilter !== 'string') {
      // This is just to ensure we handle all the different filter values and
      // don't miss one, because idOrFilter might be a string we don't actually
      // want to destructure the object
      const {
        location: _location,
        resolvedStatus: _resolvedStatus,
        metadata: _metadata,
        groupID: _groupID,
        viewer: _viewer,
        ...rest
      } = idOrFilter;
      const _: Record<string, never> = rest;
    }

    const mutationFunctions = await this._mutationFunctionsExporter.get();
    mutationFunctions.markThreadsSeenLocally({
      externalThreadID: typeof idOrFilter === 'string' ? idOrFilter : undefined,
      filter: typeof idOrFilter === 'string' ? {} : idOrFilter,
      seen,
    });
    return handleSuccessResult(
      (
        await this.apolloClient.mutate<
          MarkThreadsSeenMutationResult,
          MarkThreadsSeenMutationVariables
        >({
          mutation: MarkThreadsSeenMutation,
          variables: {
            input:
              typeof idOrFilter === 'string'
                ? {
                    seen,
                    externalThreadID: idOrFilter,
                    location: undefined,
                    resolved: undefined,
                    metadata: undefined,
                    viewer: undefined,
                  }
                : {
                    seen,
                    externalThreadID: undefined,
                    location: getLocationFilter(idOrFilter.location),
                    resolved: getResolvedFromStatus(
                      idOrFilter.resolvedStatus ?? 'any',
                    ),
                    metadata: idOrFilter.metadata,
                    viewer: getViewerThreadFilter(idOrFilter.viewer),
                  },
            _externalOrgID:
              typeof idOrFilter === 'string' ? undefined : idOrFilter.groupID,
          },
        })
      ).data?.markThreadsSeen,
    );
  }

  async searchMessages({
    textToMatch,
    authorID,
    orgID,
    groupID,
    locationOptions,
    timestampRange,
    metadata,
    limit,
    sortBy,
    sortDirection,
  }: {
    textToMatch?: string;
    authorID?: string;
    orgID?: string;
    groupID?: string;
    locationOptions?: { location: Location; partialMatch: boolean };
    timestampRange?: TimestampRange;
    metadata: EntityMetadata;
    limit: number;
    sortDirection: SortDirection;
    sortBy: SearchSortByOptions;
  }): Promise<SearchResultData[] | undefined> {
    logApiCall(THREAD_SDK_MODULE_NAME, 'searchMessages');

    const { userByID } = await this._mutationFunctionsExporter.get();

    const { data, error, loading } = await this.apolloClient.query<
      MessageContentSearchQueryResult,
      MessageContentSearchQueryVariables
    >({
      query: MessageContentSearchQuery,
      variables: {
        textToMatch,
        authorExternalID: authorID,
        // to accept both group and orgID
        orgExternalID: groupID ?? orgID,
        locationOptions,
        timestampRange:
          timestampRange?.to || timestampRange?.from
            ? {
                to: convertDateObjectIntoISOString(timestampRange?.to),
                from: convertDateObjectIntoISOString(timestampRange?.from),
              }
            : undefined,
        metadata,
        limit,
        sortBy,
        sortDirection,
      },
    });

    if (error) {
      console.error('Error searching for messages', error);
      return undefined;
    }

    if (loading) {
      return undefined;
    }

    return data.messageContentSearch.map((m) => {
      return {
        location: m.thread.location,
        ...getMessageData({
          message: m,
          thread: m.thread,
          userByInternalID: userByID,
        }),
      };
    });
  }

  get _ThreadMutationsExporterElement() {
    return this._mutationFunctionsExporter.Element;
  }
}

function ThreadReporter({ state }: { state: ThreadListenerState }) {
  return (
    <OrgOverrideProvider externalOrgID={state.options.groupID}>
      <ThreadReporterImpl state={state} />
    </OrgOverrideProvider>
  );
}

function ThreadReporterImpl({
  state: { externalThreadID, callback, options },
}: {
  state: ThreadListenerState;
}) {
  const optionsMemo = useMemoObject(options);
  const { thread, loading: threadLoading } = useThreadByExternalID(
    externalThreadID,
    optionsMemo,
  );
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  // The externalID of the oldest message we want to return in this particular
  // request.  It will be undefined if either the caller didn't specify an
  // initialFetchCount or we haven't yet looked at the thread's messages.  When
  // defined, we cut the list at that message and only return it and later
  // messages, so that a caller that requests 4 messages only gets 4, even if 6
  // messages are in the cache.
  const [oldestValidMessage, setOldestValidMessage] = useState<string>();
  const [moreLoading, setMoreLoading] = useState(false);
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const stableUserByID = useReffedFn(userByID);
  const threadRef = useUpdatingRef(thread);

  const externalizedCache = useConstant(
    () =>
      new ExternalizedCache((internal: MessageFragment) =>
        getMessageData({
          message: internal,
          // We only have messages to convert when thread is defined
          thread: threadRef.current!,
          userByInternalID: stableUserByID,
        }),
      ),
  );

  const { loadOlderMessages } = useContextThrowingIfNoProvider(ThreadsContext2);
  const realFetchMore = useCallback(
    async (n: number = INITIAL_MESSAGES_COUNT) => {
      if (!thread?.id) {
        return;
      }
      // Find oldestValidMessage, unless it's the first message (in which case
      // that's fine, we won't find the message and will return all messages,
      // which is the first message and all further).
      const splitPoint = Math.max(
        0,
        oldestValidMessage
          ? thread.messages.findIndex(
              (m, i) => i !== 0 && m.externalID === oldestValidMessage,
            )
          : 0,
      );
      if (splitPoint - 1 >= n) {
        // splitPoint - 1 is the number of non-first messages we've already
        // loaded.  If we already have enough, just move the oldest valid
        // message back that many slots
        setOldestValidMessage(thread.messages[splitPoint - n].externalID);
        return;
      }
      setMoreLoading(true);
      const newMessages = await loadOlderMessages(
        thread.id,
        n - (splitPoint - 1),
      );
      if (newMessages.length > 0) {
        setOldestValidMessage(newMessages[0].externalID);
      } else if (thread.messages.length > 0) {
        // There weren't any additional messages to load, set the max message to the first message
        setOldestValidMessage(thread.messages[0].externalID);
      }
      setMoreLoading(false);
    },
    [loadOlderMessages, oldestValidMessage, thread?.id, thread?.messages],
  );

  const allMessagesLoaded = thread
    ? thread.messages.length === thread.allMessagesCount
    : threadLoading
    ? false
    : true;

  const messages = useMemo(() => {
    if (!thread?.messages) {
      return [];
    }
    const messageData = thread.messages.map((message) =>
      externalizedCache.get(message),
    );
    if (!allMessagesLoaded) {
      // By default, our GraphQL queries always return the first message of the
      // thread, along with the last N messages (for whatever N we have loaded).
      // This is useful for our own UI, but is a bit awkward as an API -- the
      // calling code has to know that there can be a "gap" between messages[0]
      // and messages[1]. So let's not do that, remove messages[0] to eliminate
      // that gap (unless we have the entire rest of the thread in which case
      // there is no gap).
      messageData.shift();
    }
    let searchingMessage = oldestValidMessage;
    // Handle the case where this is the first time looking at the messages,
    // which means we don't yet know what the Nth message we're looking for is
    if (!searchingMessage && isDefined(options.initialFetchCount)) {
      if (options.initialFetchCount <= messageData.length) {
        searchingMessage =
          messageData[messageData.length - options.initialFetchCount].id;
        setOldestValidMessage(searchingMessage);
      }
    }
    const splitPoint = Math.max(
      0,
      searchingMessage
        ? messageData.findIndex((m) => m.id === searchingMessage)
        : 0,
    );
    messageData.splice(0, splitPoint);
    return messageData;
  }, [
    allMessagesLoaded,
    thread,
    oldestValidMessage,
    options.initialFetchCount,
    externalizedCache,
  ]);

  const summary = useMemo(() => {
    if (!thread) {
      return null;
    }

    const localSummary = getThreadSummary(thread, userByID);

    return externalThreadMatchesFilter(
      localSummary,
      userToUserData(user),
      optionsMemo.filter,
    )
      ? localSummary
      : null;
  }, [optionsMemo.filter, thread, userByID, user]);

  // Non-React callers might expect to hold on to a function like fetchMore, so
  // make sure they can do that, and we'll call the "most recent" one for them
  // internally.
  const fetchMore = useReffedFn(realFetchMore);

  useEffect(() => {
    callback({
      get summary(): ThreadSummary | undefined {
        logDeprecatedCall('observeThread.summary');
        return this.thread ?? undefined;
      },
      thread: threadLoading ? undefined : summary,
      messages,
      fetchMore,
      loading: threadLoading || moreLoading,
      hasMore: !allMessagesLoaded,
    });
  }, [
    summary,
    allMessagesLoaded,
    callback,
    fetchMore,
    messages,
    moreLoading,
    threadLoading,
  ]);

  return null;
}

function LocationDataReporter({ state }: { state: LocationDataListenerState }) {
  return (
    <OrgOverrideProvider externalOrgID={state.options.filter?.groupID}>
      <LocationDataReporterImpl state={state} />;
    </OrgOverrideProvider>
  );
}

function LocationDataReporterImpl({
  state: { location, callback, options },
}: {
  state: LocationDataListenerState;
}) {
  if (options?.includeResolved !== undefined) {
    logDeprecatedCall('thread.observeLocationData includeResolved');
  }

  // We need to have this horrific conversion for backwards compatibility.
  // One day we'll remove it.
  // We could never fetch resolved only with the old `includeResovled`
  // parameter - this is also reflected below.
  let includeResolvedToResolvedStatus: ResolvedStatus;
  switch (options?.includeResolved) {
    case true: {
      includeResolvedToResolvedStatus = 'any';
      break;
    }
    case false: {
      includeResolvedToResolvedStatus = 'unresolved';
      break;
    }
    case undefined: {
      includeResolvedToResolvedStatus = 'unresolved';
      break;
    }
    default: {
      const _: never = options?.includeResolved;
      includeResolvedToResolvedStatus = 'unresolved';
      break;
    }
  }

  const {
    threadIDs: internalIDs,
    loading,
    hasMore,
    fetchMore: realFetchMore,
  } = useGetThreadIDsOnPage({
    filter: {
      ...options.filter,
      location: options.filter?.location ?? location,
      resolvedStatus:
        options.filter?.resolvedStatus ?? includeResolvedToResolvedStatus,
    },
    partialMatch: !!options.partialMatch,
    sort: {
      sortBy: options?.sortBy ?? 'first_message_timestamp',
      sortDirection: options?.sortDirection ?? 'descending',
    },
    initialPageSize: 10,
  });

  // Non-React callers might expect to hold on to a function like fetchMore, so
  // make sure they can do that, and we'll call the "most recent" one for them
  // internally.
  const fetchMore = useReffedFn(realFetchMore);

  const threadsDataContext =
    useContextThrowingIfNoProvider(ThreadsDataContext2);
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const stableUserByID = useReffedFn(userByID);

  const externalizedCache = useConstant(
    () =>
      new ExternalizedCache((internal: ThreadData) =>
        getThreadSummary(internal, stableUserByID),
      ),
  );

  // The remaining logic is extracted into its own memoised component, to avoid
  // calling the callback unnecessarily if a change happens to an unrelated thread
  // in the ThreadsDataContext.  If you're adding a prop here, make sure you add
  // a check for it in the areEqual function below
  return (
    <CallCallbackIfNeeded
      callback={callback}
      threadsDataContext={threadsDataContext}
      externalizedCache={externalizedCache}
      internalIDs={internalIDs}
      fetchMore={fetchMore}
      loading={loading}
      hasMore={hasMore}
      includeCounts={false}
    />
  );
}

// React.memo optionally takes a function which determines whether the memoised
// component should rerender or not.  We use this here because we know that
// the threadsDataContext value will change whenever ANY thread that has been
// fetched and cached changes.  In this code however we are only interested if the
// the threadIDs matching our filter have changed, so we manually check this.
const areEqual = (
  prevProps: CallCallbackProps,
  nextProps: CallCallbackProps,
) => {
  // Still need to check all the other things and rerender if they've changed
  if (
    !Object.is(prevProps.counts, nextProps.counts) ||
    !Object.is(prevProps.includeCounts, nextProps.includeCounts) ||
    !Object.is(prevProps.hasMore, nextProps.hasMore) ||
    !Object.is(prevProps.loading, nextProps.loading) ||
    !Object.is(prevProps.internalIDs, nextProps.internalIDs) ||
    !Object.is(prevProps.fetchMore, nextProps.fetchMore) ||
    !Object.is(prevProps.callback, nextProps.callback)
  ) {
    return false;
  }

  // If any of our threads of interest have changed, do rerender.
  return !!prevProps.internalIDs?.every((id) =>
    Object.is(
      prevProps.threadsDataContext[id],
      nextProps.threadsDataContext[id],
    ),
  );
};

type CallCallbackProps = {
  internalIDs: string[] | undefined;
  threadsDataContext: ThreadsDataContextType;
  externalizedCache: ExternalizedCache<ThreadData, ThreadSummary>;
  callback: LocationDataCallback;
  fetchMore: (howMany: number) => Promise<void>;
  loading: boolean;
  hasMore: boolean;
  counts?: ThreadActivitySummary | undefined;
  includeCounts: boolean;
};

const CallCallbackIfNeeded = memo(function CallCallback({
  internalIDs,
  callback,
  threadsDataContext,
  externalizedCache,
  fetchMore,
  loading,
  hasMore,
  counts,
  includeCounts,
}: CallCallbackProps) {
  const threadSummaries = internalIDs
    ?.map((id) => threadsDataContext[id])
    .map((threadData) => externalizedCache.get(threadData));

  useEffect(() => {
    callback({
      threads: threadSummaries ?? [],
      ...(includeCounts && { counts }),
      fetchMore,
      loading,
      hasMore,
    });
  }, [
    callback,
    counts,
    fetchMore,
    hasMore,
    includeCounts,
    loading,
    threadSummaries,
  ]);

  return null;
}, areEqual);

function ThreadsReporter({ state }: { state: ThreadsListenerState }) {
  return (
    <OrgOverrideProvider externalOrgID={state.options.filter?.groupID}>
      <ThreadsReporterImpl state={state} />;
    </OrgOverrideProvider>
  );
}

function ThreadsReporterImpl({
  state: { callback, options },
}: {
  state: ThreadsListenerState;
}) {
  const {
    metadata,
    location,
    groupID: _groupID,
    resolvedStatus,
    viewer,
    ...rest
  } = options.filter ?? {};
  const _: Record<string, never> = rest;

  const locationFilter = getLocationFilter(location);
  const {
    threadIDs: internalIDs,
    loading,
    hasMore,
    fetchMore: realFetchMore,
  } = useGetThreadIDsOnPage({
    filter: {
      metadata: metadata,
      location: locationFilter?.value,
      resolvedStatus: resolvedStatus ?? 'any',
      viewer,
    },
    partialMatch: !!locationFilter?.partialMatch,
    sort: {
      sortBy: options?.sortBy ?? 'first_message_timestamp',
      sortDirection: options?.sortDirection ?? 'descending',
    },
    initialPageSize: options?.initialFetchCount
      ? Math.min(options.initialFetchCount, THREAD_INITIAL_PAGE_SIZE_LIMIT)
      : DEFAULT_THREAD_INITIAL_PAGE_SIZE,
  });

  // Non-React callers might expect to hold on to a function like fetchMore, so
  // make sure they can do that, and we'll call the "most recent" one for them
  // internally.
  const fetchMore = useReffedFn(realFetchMore);

  const threadsDataContext =
    useContextThrowingIfNoProvider(ThreadsDataContext2);
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const stableUserByID = useReffedFn(userByID);

  const externalizedCache = useConstant(
    () =>
      new ExternalizedCache((internal: ThreadData) =>
        getThreadSummary(internal, stableUserByID),
      ),
  );

  const counts = useGetThreadCounts({ filter: options.filter });

  return (
    <CallCallbackIfNeeded
      internalIDs={internalIDs}
      threadsDataContext={threadsDataContext}
      externalizedCache={externalizedCache}
      callback={callback}
      fetchMore={fetchMore}
      loading={loading}
      hasMore={hasMore}
      includeCounts={true}
      counts={counts}
    />
  );
}

function useThreadMutationFunctions(): ThreadMutationFunctions {
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);
  const threadsContext = useContextThrowingIfNoProvider(ThreadsContext2);
  const {
    markThreadsSeenLocally,
    getThreadByExternalID,
    setSubscribed,
    mergeOptimisticMessage,
  } = threadsContext;
  const screenshotConfig = useContextThrowingIfNoProvider(
    ScreenshotConfigContext,
  );

  const logger = useLogger();
  const {
    screenshotOptions: { blur },
  } = useContextThrowingIfNoProvider(ConfigurationContext);

  const takeScreenshotOfCanvasOnly = useFeatureFlag(
    FeatureFlags.TAKE_SCREENSHOT_OF_CANVAS_ONLY,
  );
  const { createFileForUpload, uploadFile } = useFileUploader();

  const captureScreenshotFn = useCallback(async () => {
    return await captureScreenshot({
      logger,
      sidebarVisible: false,
      blurScreenshotsOnCapture: blur,
      screenshotConfig,
      takeScreenshotOfCanvasOnly,
      createFileForUpload,
      uploadFile,
    });
  }, [
    blur,
    createFileForUpload,
    logger,
    screenshotConfig,
    takeScreenshotOfCanvasOnly,
    uploadFile,
  ]);

  return {
    markThreadsSeenLocally,
    getThreadByExternalID,
    userByID,
    setSubscribed,
    captureScreenshotFn,
    mergeOptimisticMessage,
  };
}

function MessageDataReporter({ state }: { state: MessageDataListenerState }) {
  const { message, thread } = useMessageByExternalID({
    messageID: state.externalMessageID,
    threadID: undefined,
  });
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const messageData = useMemo(() => {
    // Make sure to return null if no results found
    // and undefined if data is still loading
    if (!message || !thread) {
      if (message === undefined && thread === undefined) {
        return undefined;
      }
      return null;
    }
    return getMessageData({
      message,
      thread,
      userByInternalID: userByID,
    });
  }, [message, thread, userByID]);

  useEffect(() => {
    if (messageData === undefined) {
      return;
    }
    state.callback(messageData);
  }, [messageData, state]);

  return null;
}
