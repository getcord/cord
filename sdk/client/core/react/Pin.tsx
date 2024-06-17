import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import type { PinReactComponentProps } from '@cord-sdk/react';
import type { ThreadSummary } from '@cord-sdk/types';
import { AnnotationPinWithAvatar } from 'external/src/components/ui3/AnnotationPinWithAvatar.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useThreadByExternalID } from 'external/src/context/threads2/useThreadByExternalID.ts';
import { DisabledCSSVariableOverrideContextProvider } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { ComponentPageContextProvider } from 'sdk/client/core/react/ComponentPageContextProvider.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import 'sdk/client/core/react/Pin.css';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

function Pin({
  threadId: externalThreadID,
  location,
  onResolve,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: PinReactComponentProps) {
  return (
    <DisabledCSSVariableOverrideContextProvider>
      <ComponentPageContextProvider location={location}>
        <PinImpl
          externalThreadID={externalThreadID}
          onResolve={onResolve}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      </ComponentPageContextProvider>
    </DisabledCSSVariableOverrideContextProvider>
  );
}

function PinImpl({
  externalThreadID,
  onResolve,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
}: React.PropsWithChildren<{
  externalThreadID: string;
  onResolve?: (thread: ThreadSummary | null) => unknown;
  onClick?: (thread: ThreadSummary | null) => unknown;
  onMouseEnter?: (thread: ThreadSummary | null) => unknown;
  onMouseLeave?: (thread: ThreadSummary | null) => unknown;
}>) {
  const { thread, loading } = useThreadByExternalID(externalThreadID);

  const { user: viewerUser } = useContextThrowingIfNoProvider(IdentityContext);

  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const userData = useMemo(() => {
    if (loading) {
      return undefined;
    }
    const firstMessageAuthorID = thread?.messages[0]?.source.id;

    // Show avatar of first user to message in thread
    if (firstMessageAuthorID) {
      return userByID(firstMessageAuthorID);
    }

    // Otherwise, assume this is a draft thread and show current user
    return viewerUser;
  }, [loading, thread, userByID, viewerUser]);

  const isResolvedRef = useRef(thread?.resolved);

  const threadSummary = useMemo(
    () => (thread ? getThreadSummary(thread, userByID) : null),
    [thread, userByID],
  );
  useEffect(() => {
    if (
      isResolvedRef?.current !== undefined &&
      isResolvedRef?.current !== thread?.resolved &&
      thread?.resolved
    ) {
      onResolve?.(threadSummary);
    }
    isResolvedRef.current = thread?.resolved;
  }, [onResolve, thread, thread?.resolved, threadSummary]);

  const onClickWithThread = useCallback(() => {
    onClick?.(threadSummary);
  }, [onClick, threadSummary]);
  const onMouseEnterWithThread = useCallback(() => {
    onMouseEnter?.(threadSummary);
  }, [onMouseEnter, threadSummary]);
  const onMouseLeaveWithThread = useCallback(() => {
    onMouseLeave?.(threadSummary);
  }, [onMouseLeave, threadSummary]);

  return (
    <AnnotationPinWithAvatar
      // show 'read' coloured pin while loading
      unread={thread?.hasNewMessages ?? false}
      userData={userData ? userToUserData(userData) : undefined}
      onMouseEnter={onMouseEnterWithThread}
      onMouseLeave={onMouseLeaveWithThread}
      onClick={onClickWithThread}
    >
      {children}
    </AnnotationPinWithAvatar>
  );
}

// TODO: make this automatic
export default memo(Pin);
