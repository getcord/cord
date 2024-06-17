import type { ApolloClient, ObservableSubscription } from '@apollo/client';
import { useCallback, useEffect, useMemo } from 'react';
import type {
  ICordNotificationSDK,
  ListenerRef,
  MarkAllNotificationsAsReadOptions,
  NotificationDataUpdateCallback,
  NotificationListFilter,
  NotificationSummary,
  NotificationSummaryUpdateCallback,
  ObserveNotificationDataOptions,
  ObserveNotificationSummaryOptions,
} from '@cord-sdk/types';
import {
  ClearNotificationsForMessageMutation,
  DeleteNotificationMutation,
  NotificationSummaryQuery,
  NotificationSummarySubscription,
} from 'external/src/graphql/operations.ts';
import type {
  ClearNotificationsForMessageMutationResult,
  ClearNotificationsForMessageMutationVariables,
  DeleteNotificationMutationResult,
  DeleteNotificationMutationVariables,
  NotificationSummaryQueryResult,
  NotificationSummaryQueryVariables,
  NotificationSummarySubscriptionResult,
  NotificationSummarySubscriptionVariables,
} from 'external/src/graphql/operations.ts';
import { logApiCall } from 'sdk/client/core/cordAPILogger.ts';
import type { CordInternalCall } from 'sdk/client/core/index.tsx';
import {
  makeGenericExporter,
  makeSingletonExporter,
} from 'sdk/client/core/genericExporter.tsx';
import type { NotificationsContextType } from 'external/src/context/notifications/NotificationsContext.tsx';
import {
  NotificationsContext,
  NotificationsListContext,
} from 'external/src/context/notifications/NotificationsContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { NotificationsListProvider } from 'external/src/context/notifications/NotificationsListProvider.tsx';
import { gqlNotificationFragmentToNotificationVariables } from 'common/util/convertToExternal/notification.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { Errors } from 'common/const/Errors.ts';
import { handleSuccessResult } from 'sdk/client/core/util.ts';
import { getLocationFilter } from 'common/types/index.ts';

const NOTIFICATION_SDK_MODULE_NAME = 'notification';

type NotificationSummaryListenerState = {
  callback: NotificationSummaryUpdateCallback;
  summary: NotificationSummary | undefined;
  subscription: ObservableSubscription;
};

type NotificationDataListenerState = {
  callback: NotificationDataUpdateCallback;
  options: ObserveNotificationDataOptions;
};

type NotificationMutationFunctions = {
  markAllNotificationsAsRead: NotificationsContextType['markAllNotificationsAsRead'];
  markNotificationAsRead: NotificationsContextType['markNotificationAsRead'];
  markNotificationAsUnread: NotificationsContextType['markNotificationAsUnread'];
};

function isDifferentSummary(
  a: NotificationSummary | undefined,
  b: NotificationSummary,
): boolean {
  return a?.unread !== b.unread;
}

export class NotificationSDK implements ICordNotificationSDK {
  private _listeners = new Map<ListenerRef, NotificationSummaryListenerState>();
  private _listenerKey = 0;

  private _notificationDataExporter = makeGenericExporter(
    NotificationDataReporter,
  );

  private _mutationFunctionsExporter = makeSingletonExporter(
    useNotificationMutationFunctions,
  );

  constructor(private apolloClient: ApolloClient<any>) {}

  observeNotificationCounts(
    callback: NotificationSummaryUpdateCallback,
    options: ObserveNotificationSummaryOptions & CordInternalCall = {},
  ): ListenerRef {
    const key = this._listenerKey++;
    const onResponse = (
      notificationSummary: NotificationSummaryQueryResult['notificationSummary'],
    ) => {
      const record = this._listeners.get(key);
      if (!record) {
        return;
      }

      const summary: NotificationSummary = {
        unread: notificationSummary.unreadNotificationCount,
      };

      if (isDifferentSummary(record.summary, summary)) {
        record.summary = summary;
        record.callback(summary);
      }
    };
    const locationFilter = getLocationFilter(options.filter?.location);

    this.apolloClient
      .query<NotificationSummaryQueryResult, NotificationSummaryQueryVariables>(
        {
          query: NotificationSummaryQuery,
          variables: {
            filter: {
              metadata: options?.filter?.metadata ?? undefined,
              location: locationFilter?.value ?? undefined,
              partialMatch: locationFilter?.partialMatch ?? undefined,
              organizationID:
                options?.filter?.groupID ??
                options?.filter?.organizationID ??
                undefined,
            },
          },
        },
      )
      .then((results) => {
        if (results.errors) {
          throw results.errors[0];
        }
        onResponse(results.data.notificationSummary);
      })
      .catch((error) => {
        if (
          'message' in error &&
          error['message'] === Errors.USER_NOT_IN_GROUP
        ) {
          console.error(
            `User is not part of group ${
              options?.filter?.groupID ?? options?.filter?.organizationID
            }.`,
          );
        } else {
          console.error('Error fetching notification summary', error);
        }
      });

    const subscription = this.apolloClient
      // ApolloClient.subscribe takes a query and variables, and returns an Observable object.
      .subscribe<
        NotificationSummarySubscriptionResult,
        NotificationSummarySubscriptionVariables
      >({
        query: NotificationSummarySubscription,
        variables: {
          filter: {
            metadata: options.filter?.metadata ?? undefined,
            location: locationFilter?.value ?? undefined,
            partialMatch: locationFilter?.partialMatch ?? undefined,
            organizationID:
              options.filter?.groupID ??
              options.filter?.organizationID ??
              undefined,
          },
        },
      })
      // We call subscribe on this Observable object to access incoming data
      // More details here https://github.com/zenparsing/zen-observable
      .subscribe(({ data }) => {
        if (data && data.notificationSummaryUpdated) {
          onResponse(data.notificationSummaryUpdated);
        }
      });

    this._listeners.set(key, { callback, subscription, summary: undefined });

    if (!options.__cordInternal) {
      logApiCall(NOTIFICATION_SDK_MODULE_NAME, 'observeNotificationCounts');
    }

    return key;
  }

  unobserveNotificationCounts(ref: ListenerRef): boolean {
    const record = this._listeners.get(ref);
    if (!record) {
      return false;
    }

    record.subscription.unsubscribe();
    this._listeners.delete(ref);
    return true;
  }

  /**
   * @deprecated Renamed to `observeNotificationCounts`
   */
  observeSummary(
    callback: NotificationSummaryUpdateCallback,
    options?: ObserveNotificationSummaryOptions | undefined,
  ): ListenerRef {
    return this.observeNotificationCounts(callback, options);
  }

  /**
   * @deprecated Renamed to `unobserveNotificationCounts`
   */
  unobserveSummary(ref: ListenerRef): boolean {
    return this.unobserveNotificationCounts(ref);
  }

  observeNotifications(
    callback: NotificationDataUpdateCallback,
    options: ObserveNotificationDataOptions = {},
  ): ListenerRef {
    logApiCall(NOTIFICATION_SDK_MODULE_NAME, 'observeNotifications');
    return this._notificationDataExporter.observe({ callback, options });
  }

  /**
   * @deprecated Renamed to `observeNotifications`
   */
  observeData(
    callback: NotificationDataUpdateCallback,
    options?: ObserveNotificationDataOptions | undefined,
  ): ListenerRef {
    return this.observeNotifications(callback, options);
  }

  unobserveNotifications(ref: ListenerRef): boolean {
    return this._notificationDataExporter.unobserve(ref);
  }

  /**
   * @deprecated Renamed to `unobserveNotifications`
   */
  unobserveData(ref: ListenerRef): boolean {
    return this.unobserveNotifications(ref);
  }

  async markAsRead(notificationID: string) {
    logApiCall(NOTIFICATION_SDK_MODULE_NAME, 'markAsRead');
    const mutationFunctions = await this._mutationFunctionsExporter.get();
    return await mutationFunctions.markNotificationAsRead(notificationID, true);
  }

  async markAsUnread(notificationID: string) {
    logApiCall(NOTIFICATION_SDK_MODULE_NAME, 'markAsUnread');
    const mutationFunctions = await this._mutationFunctionsExporter.get();
    return await mutationFunctions.markNotificationAsUnread(notificationID);
  }

  async markAllAsRead(options: MarkAllNotificationsAsReadOptions = {}) {
    logApiCall(NOTIFICATION_SDK_MODULE_NAME, 'markAllAsRead');

    const { filter } = options;
    if (filter?.messageID) {
      if (Object.keys(filter).length > 1) {
        throw new Error('Cannot combine messageID filter with others');
      }
      await this.apolloClient.mutate<
        ClearNotificationsForMessageMutationResult,
        ClearNotificationsForMessageMutationVariables
      >({
        mutation: ClearNotificationsForMessageMutation,
        variables: {
          messageID: filter?.messageID,
          byExternalID: true,
        },
      });
      return;
    }

    // Rebuild object ourselves to prevent passing invalid GraphQL
    const variables: NotificationListFilter = {
      metadata: filter?.metadata ?? undefined,
      location: filter?.location ?? undefined,
      organizationID: filter?.groupID ?? filter?.organizationID ?? undefined,
    };

    const mutationFunctions = await this._mutationFunctionsExporter.get();
    return await mutationFunctions.markAllNotificationsAsRead(
      variables,
      // No optimistic updates in the API for now, too weird/awkward. Can add later if needed.
      [],
      true,
    );
  }

  async delete(notificationID: string): Promise<true> {
    logApiCall(NOTIFICATION_SDK_MODULE_NAME, 'delete');
    return handleSuccessResult(
      (
        await this.apolloClient.mutate<
          DeleteNotificationMutationResult,
          DeleteNotificationMutationVariables
        >({
          mutation: DeleteNotificationMutation,
          variables: {
            notificationID: notificationID,
            byExternalID: true,
          },
        })
      ).data?.deleteNotification,
    );
  }

  get _NotificationDataExporterElement() {
    return this._notificationDataExporter.Element;
  }

  get _NotificationMutationsExporterElement() {
    return this._mutationFunctionsExporter.Element;
  }

  /**
   * @deprecated Renamed to unobserveSummary.
   */
  unobserveNotificationSummary(
    ...args: Parameters<typeof this.unobserveSummary>
  ) {
    return this.unobserveSummary(...args);
  }
}

function NotificationDataReporter({
  state,
}: {
  state: NotificationDataListenerState;
}) {
  return (
    <NotificationsListProvider filter={state.options.filter}>
      <NotificationDataReporterImpl state={state} />
    </NotificationsListProvider>
  );
}

function NotificationDataReporterImpl({
  state,
}: {
  state: NotificationDataListenerState;
}) {
  const { notifications, loading, hasMore, fetchAdditionalNotifications } =
    useContextThrowingIfNoProvider(NotificationsListContext);
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const mappedNotifs = useMemo(
    () =>
      notifications.map((notif) =>
        gqlNotificationFragmentToNotificationVariables(notif, userByID),
      ),
    [notifications, userByID],
  );

  // The fetchAdditionalNotifications function closes over the pagination info,
  // i.e., it changes every page and so you shouldn't re-use the function.
  // That's easy enough to avoid inside React, but is much more error-prone for
  // an external API. Do a bit of wonky wrapping with refs to turn it into a
  // fetchMore function which is safe to reuse.
  const loadingRef = useUpdatingRef(loading);
  const fetchAdditionalNotificationsRef = useUpdatingRef(
    fetchAdditionalNotifications,
  );
  const fetchMore = useCallback(
    async (...args: Parameters<typeof fetchAdditionalNotifications>) => {
      if (loadingRef.current) {
        return;
      }
      return await fetchAdditionalNotificationsRef.current(...args);
    },
    [fetchAdditionalNotificationsRef, loadingRef],
  );

  useEffect(() => {
    state.callback({
      notifications: mappedNotifs,
      loading,
      hasMore,
      fetchMore,
    });
  }, [fetchMore, hasMore, loading, mappedNotifs, state]);

  return null;
}

function useNotificationMutationFunctions(): NotificationMutationFunctions {
  const {
    markAllNotificationsAsRead,
    markNotificationAsRead,
    markNotificationAsUnread,
  } = useContextThrowingIfNoProvider(NotificationsContext);
  return {
    markAllNotificationsAsRead,
    markNotificationAsRead,
    markNotificationAsUnread,
  };
}
