import * as React from 'react';
import type { FunctionComponent, MutableRefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isEqualLocation } from '@cord-sdk/types';
import type {
  LiveCursorsEventToLocationFn,
  LiveCursorsLocationToDocumentFn,
  Location,
  LiveCursorsCursorPosition,
  ClientUserData,
  LiveCursorsEventToLocationFnOptions,
} from '@cord-sdk/types';

import { useCordLocation } from '../hooks/useCordLocation.js';
import * as user from '../hooks/user.js';
import { useCordContext } from '../contexts/CordContext.js';
import { debounce } from '../common/lib/debounce.js';
import { withGroupIDCheck } from '../common/hoc/withGroupIDCheck.js';
import {
  LiveCursorsDefaultClick,
  LiveCursorsDefaultCursor,
} from './LiveCursorsDefaultCursor.js';
import type { LiveCursorsCursorProps } from './LiveCursorsDefaultCursor.js';

export const POSITION_UPDATE_INTERVAL_MS = 100;

export type LiveCursorsReactComponentProps = {
  location?: Location;
  groupId?: string;
  showViewerCursor?: boolean;
  translations?: {
    eventToLocation: LiveCursorsEventToLocationFn;
    locationToDocument: LiveCursorsLocationToDocumentFn;
  };
  cursorComponent?: FunctionComponent<LiveCursorsCursorProps>;
  sendCursor?: boolean;
  showCursors?: boolean;
  boundingElementRef?: MutableRefObject<HTMLElement | null>;
  clickComponent?: FunctionComponent<LiveCursorsCursorProps>;
  sendClicks?: boolean;
  showClicks?: boolean;
  clickDisplayDuration?: number;
};

/**
 * Default translation function to convert a MouseEvent into a serialized
 * location.  The primary data we try to use is from
 * `CordSDK.annotation.viewportCoordinatesToString`. That's not always available
 * though, so we also transmit absolute x/y coordinates.
 */
export async function defaultEventToLocation(
  e: MouseEvent,
  options: LiveCursorsEventToLocationFnOptions,
): Promise<Location> {
  const annotationSDK = window.CordSDK?.annotation;
  const s = await annotationSDK?.viewportCoordinatesToString({
    x: e.clientX,
    y: e.clientY,
  });

  const annotationObj: Record<string, string> = s
    ? { __cord_annotation: s }
    : {};
  return {
    __cord_cursor_x: e.pageX,
    __cord_cursor_y: e.pageY,
    __cord_cursor_click: options?.send_clicks ? e.buttons === 1 : false,
    ...annotationObj,
  };
}

/**
 * Default translation function to convert a Location into x/y coordinates. This
 * primarily tries to use `CordSDK.annotation.stringToViewportCoordinates` to
 * get coordinates, if that data is available and the Cord SDK can find a
 * suitable element that it references. If that doesn't work, fall back on x/y
 * coordinates, which should always be present.
 */
export async function defaultLocationToDocument(
  location: Location,
): Promise<LiveCursorsCursorPosition> {
  const annotationSDK = window.CordSDK?.annotation;
  const click =
    '__cord_cursor_click' in location && !!location.__cord_cursor_click;

  if ('__cord_annotation' in location && annotationSDK) {
    const coords = await annotationSDK.stringToViewportCoordinates(
      String(location.__cord_annotation),
    );
    if (coords) {
      return {
        viewportX: coords.x,
        viewportY: coords.y,
        click,
      };
    }
  }

  if ('__cord_cursor_x' in location && '__cord_cursor_y' in location) {
    return {
      viewportX: (location.__cord_cursor_x as number) - window.scrollX,
      viewportY: (location.__cord_cursor_y as number) - window.scrollY,
      click,
    };
  }

  return null;
}

type CursorPosition = NonNullable<LiveCursorsCursorPosition>;
type ClickPosition = CursorPosition & {
  clickTimestamp: number;
};

// A secret param passed to a few API functions which only affects Cord's
// logging. Feel free to remove this if you're modifying this code in your own
// app.
const cordInternal: any = {
  __cordInternal: true,
};

export const LiveCursors = withGroupIDCheck<LiveCursorsReactComponentProps>(
  LiveCursorsImpl,
  'LiveCursors',
);

export function LiveCursorsImpl({
  location: locationProp,
  groupId,
  showViewerCursor,
  translations,
  cursorComponent,
  sendCursor = true,
  showCursors = true,
  boundingElementRef,
  clickComponent,
  sendClicks = false,
  showClicks = false,
  clickDisplayDuration = 1000,
  ...remainingProps
}: LiveCursorsReactComponentProps) {
  // Make sure we've covered all the props we say we take; given the layers of
  // type generics etc it's easy to forget something.
  const _: Record<string, never> = remainingProps;
  const contextLocation = useCordLocation();
  const locationInput = locationProp ?? contextLocation;
  if (!locationInput) {
    throw new Error('cord-live-cursors: missing location');
  }

  const eventToLocation =
    translations?.eventToLocation ?? defaultEventToLocation;
  const locationToDocument =
    translations?.locationToDocument ?? defaultLocationToDocument;
  // The "base" location for all of our presence updates. We transmit our cursor
  // position by encoding our cursor information into a sub-location of this and
  // setting ourselves as present there (setting this base location as
  // "exclusive within" to clear our presence at any other such sub-locations).
  // Then we get others' cursor positions by looking for others present at this
  // base location, using partial matching so that we get back all of the
  // sub-locations with their cursor information encoded.
  const baseLocation = useMemo(
    () => ({
      ...locationInput,
      __cord_live_cursors: true,
    }),
    [locationInput],
  );

  useSendCursor(
    baseLocation,
    eventToLocation,
    groupId,
    !sendCursor,
    sendClicks,
    boundingElementRef,
  );

  const userCursors = useUserCursors(
    baseLocation,
    locationToDocument,
    !!showViewerCursor,
    !showCursors,
    boundingElementRef,
  );

  const userCursorClicks = useUserCursorClicks(
    userCursors,
    clickDisplayDuration,
    !showClicks,
  );

  // Load detailed information for each user whose cursor we have, so we can
  // display their name etc.
  const users = user.useUserData(Object.keys(userCursors));
  const viewerID = useViewerID();

  // Combine the userCursors user ID and position info with the detailed user
  // information to produce the information Cursor needs to actually render.
  const cursorData = useMemo<LiveCursorsCursorProps[]>(
    () => getLiveCursorsProps(viewerID, userCursors, users),

    [viewerID, userCursors, users],
  );

  const clickData = useMemo<LiveCursorsCursorProps[]>(
    () => getLiveCursorsProps(viewerID, userCursorClicks, users),
    [viewerID, userCursorClicks, users],
  );
  const Cursor = cursorComponent ?? LiveCursorsDefaultCursor;
  const Click = clickComponent ?? LiveCursorsDefaultClick;

  return (
    <>
      {cursorData.map((props) => (
        <Cursor key={props.user.id} {...props} />
      ))}
      {clickData.map((props) => (
        <Click key={props.user.id} {...props} />
      ))}
    </>
  );
}

function useViewerID() {
  const viewerData = user.useViewerData();
  return viewerData?.id;
}

function getLiveCursorsProps(
  viewerID: string | undefined,
  cursorPositions: Record<string, CursorPosition>,
  users: Record<string, ClientUserData | null>,
): LiveCursorsCursorProps[] {
  if (viewerID === undefined) {
    // Skip if we don't know who the viewer is, since we don't want to show
    // them their own cursor.
    return [];
  }
  return Object.keys(cursorPositions)
    .filter((id) => cursorPositions[id] && users[id])
    .map((id) => ({
      user: users[id]!,
      pos: cursorPositions[id],
    }));
}

/**
 * Add event listeners for mouse movements, and transmit our cursor's position
 * via the presence API.
 */
function useSendCursor(
  baseLocation: Location,
  eventToLocation: LiveCursorsEventToLocationFn,
  groupID: string | undefined,
  skip = false,
  sendClicks = false,
  boundingElementRef?: MutableRefObject<HTMLElement | null>,
): void {
  const { sdk } = useCordContext('LiveCursors.useSendCursor');
  const presenceSDK = sdk?.presence;

  // The result of eventToLocation from our own most recent mouse move, or null
  // if we haven't moved our mouse or have moved it outside of the page.
  const mouseLocationRef = useRef<Location | null>(null);

  const clearPresence = useCallback(() => {
    if (lastLocationRef.current && presenceSDK) {
      void presenceSDK.setPresent(
        {
          // We put baseLocation second so in case the same key is available in
          // both, the value from baseLocation is used, so that the overall
          // matching will work.
          ...lastLocationRef.current,
          ...baseLocation,
        },
        {
          exclusive_within: baseLocation,
          absent: true,
          groupID,
          ...cordInternal,
        },
      );
    }
  }, [presenceSDK, baseLocation, groupID]);

  // Track our own mouse movements and write them into mouseLocationRef.
  useEffect(() => {
    if (skip) {
      return;
    }

    const onMouseMoveOrClick = (e: MouseEvent) => {
      void (async () => {
        mouseLocationRef.current = await eventToLocation(e, {
          send_clicks: sendClicks,
        });
      })();
    };

    const onMouseLeave = () => {
      mouseLocationRef.current = null;
    };

    const element = boundingElementRef?.current;

    if (element) {
      element.addEventListener('mousemove', onMouseMoveOrClick);
      element.addEventListener('mouseleave', onMouseLeave);
      element.addEventListener('mousedown', onMouseMoveOrClick);
    } else if (!boundingElementRef) {
      document.addEventListener('mousedown', onMouseMoveOrClick);
      document.addEventListener('mousemove', onMouseMoveOrClick);
      document.addEventListener('mouseleave', onMouseLeave);
    }

    window.addEventListener('beforeunload', clearPresence);

    return () => {
      clearPresence();
      if (element) {
        element.removeEventListener('mousemove', onMouseMoveOrClick);
        element.removeEventListener('mouseleave', onMouseLeave);
        element.removeEventListener('mousedown', onMouseMoveOrClick);
      } else if (!boundingElementRef) {
        document.removeEventListener('mousemove', onMouseMoveOrClick);
        document.removeEventListener('mouseleave', onMouseLeave);
        document.removeEventListener('mousedown', onMouseMoveOrClick);
      }
      window.removeEventListener('beforeunload', clearPresence);
    };
  }, [eventToLocation, clearPresence, skip, boundingElementRef, sendClicks]);

  // The last mouseLocationRef that we transmitted. Track this so that we don't
  // send unnecessary presence updates if our cursor hasn't actually moved.
  const lastLocationRef = useRef<Location | undefined>(undefined);

  useEffect(() => {
    if (skip) {
      return;
    }

    const timer = setInterval(() => {
      // If the we are currently on the page...
      if (mouseLocationRef.current && presenceSDK) {
        // ...and our mouse has moved...
        if (
          !isEqualLocation(mouseLocationRef.current, lastLocationRef.current)
        ) {
          // ... send an update. See comment above the definition of
          // baseLocation in the main component describing the format of this
          // update.
          void presenceSDK.setPresent(
            {
              // We put baseLocation second so in case the same key is available
              // in both, the value from baseLocation is used, so that the
              // overall matching will work.
              ...mouseLocationRef.current,
              ...baseLocation,
            },
            { exclusive_within: baseLocation, groupID, ...cordInternal },
          );
          lastLocationRef.current = mouseLocationRef.current;
        }
      } else if (lastLocationRef.current) {
        // If we aren't currently on the page, but we have an active mouse
        // position on the server, clear it.
        clearPresence();
        lastLocationRef.current = undefined;
      }
    }, POSITION_UPDATE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [presenceSDK, baseLocation, clearPresence, groupID, skip]);
}

/**
 * Subscribe to presence updates listening for other users' cursors, and return
 * a map from user ID to CursorState for other users' cursors currently on the
 * page.
 */
function useUserCursors(
  baseLocation: Location,
  locationToDocument: LiveCursorsLocationToDocumentFn,
  showViewerCursor: boolean,
  skip = false,
  boundingElementRef?: MutableRefObject<HTMLElement | null>,
): Record<string, CursorPosition> {
  const { sdk } = useCordContext('LiveCursors.useUserCursors');
  const presenceSDK = sdk?.presence;

  const viewerID = useViewerID();

  // Cord presence gives us a Location for the cursor, which is a durable
  // semantic encoding. We then convert that into a CursorPosition, which is
  // viewport-relative x/y coordinates. Those viewport coordinates change as
  // they scroll, so we need to track the original Location for each cursor and
  // recompute both when we get any updates and when the page is scrolled.
  // Unfortunately that conversion process is async, so it needs to happen in
  // the event handlers (we can't just have one state to store the Location and
  // convert as we return). Instead, use a ref to track the Location (we don't
  // need to rerender when it changes, just need a persistent place to hold onto
  // it), and then have a helper function which does the conversion into another
  // state which is the actual CursorPosition we can return. (We immediately
  // call that conversion helper after changes to the Locations.)
  const cursorLocations = useRef<Record<string, Location>>({});
  const [cursorPositions, setCursorPositions] = useState<
    Record<string, CursorPosition>
  >({});

  // Aforementioned conversion function, see above.
  const computeCursorPositions = useCallback(async () => {
    const newCursorPositions: Record<string, CursorPosition> = {};
    const boundingElementRect =
      boundingElementRef?.current?.getBoundingClientRect();

    await Promise.all(
      Object.entries(cursorLocations.current).map(async ([id, location]) => {
        const pos = await locationToDocument(location);

        if (pos) {
          if (!boundingElementRef || !boundingElementRect) {
            newCursorPositions[id] = pos;
          } else {
            const { top, left, width, height } = boundingElementRect;
            if (
              pos.viewportX > left &&
              pos.viewportX < left + width &&
              pos.viewportY > top &&
              pos.viewportY < top + height
            ) {
              newCursorPositions[id] = pos;
            }
          }
        }
      }),
    );
    setCursorPositions(newCursorPositions);
  }, [locationToDocument, boundingElementRef]);

  const debouncedComputeCursorPositions = useMemo(
    () => debounce(50, computeCursorPositions),
    [computeCursorPositions],
  );

  // Listen for and process cursor updates from other users.
  useEffect(() => {
    if (viewerID === undefined || !presenceSDK || skip) {
      return undefined;
    }

    // Partial match listen for presence updates at baseLocation. See comment
    // above the definition of baseLocation in the main component for an
    // overview of how this works.
    const locationDataListenerRef = presenceSDK.observePresence(
      baseLocation,
      async (data) => {
        data.forEach(({ id, ephemeral }) => {
          const receivedLocation = ephemeral.locations[0];
          if ((showViewerCursor || id !== viewerID) && receivedLocation) {
            cursorLocations.current[id] = receivedLocation;
          } else {
            delete cursorLocations.current[id];
          }
        });
        debouncedComputeCursorPositions();
      },
      {
        partial_match: true,
        exclude_durable: true,
        ...cordInternal,
      },
    );

    return () => {
      presenceSDK.unobservePresence(locationDataListenerRef);
    };
  }, [
    locationToDocument,
    presenceSDK,
    baseLocation,
    viewerID,
    showViewerCursor,
    debouncedComputeCursorPositions,
    skip,
  ]);

  // Also recompute positions on scroll, since the coordinates are
  // viewport-relative.
  useEffect(() => {
    document.addEventListener('scroll', debouncedComputeCursorPositions);
    document.addEventListener('wheel', debouncedComputeCursorPositions);
    document.addEventListener('resize', debouncedComputeCursorPositions);
    return () => {
      document.removeEventListener('scroll', debouncedComputeCursorPositions);
      document.removeEventListener('wheel', debouncedComputeCursorPositions);
      document.removeEventListener('resize', debouncedComputeCursorPositions);
    };
  }, [debouncedComputeCursorPositions]);

  return cursorPositions;
}

function useUserCursorClicks(
  userCursors: Record<string, CursorPosition>,
  clickDisplayDuration: number,
  skip: boolean,
): Record<string, ClickPosition> {
  const [clickPositions, setClickPositions] = useState<
    Record<string, ClickPosition>
  >({});

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const newClicks: [string, ClickPosition][] = [];

  Object.entries(userCursors).forEach(([id, position]) => {
    const { click, viewportX, viewportY } = position;
    if (
      !skip &&
      click &&
      viewportX !== clickPositions[id]?.viewportX &&
      viewportY !== clickPositions[id]?.viewportY
    ) {
      newClicks.push([id, { ...position, clickTimestamp: Date.now() }]);
    }
  });

  if (newClicks.length > 0) {
    const newClickPositions = {
      ...clickPositions,
      ...Object.fromEntries(newClicks),
    };
    setClickPositions(newClickPositions);
  }

  useEffect(() => {
    const next = findNextExpiryTime(clickPositions, clickDisplayDuration);
    if (next !== null) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        // When another click comes then setClickPositions
        // will execute and cause this useEffect to run again to set up the next
        // applicable timeout. This means we don't need to set up another
        // expiry here.
        const pruned = pruneExpiredClicks(clickPositions, clickDisplayDuration);
        setClickPositions(pruned);
      }, next);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [clickDisplayDuration, clickPositions, skip]);
  return clickPositions;
}

function findNextExpiryTime(
  clickPositions: Record<string, ClickPosition>,
  clickDisplayDuration: number,
): number | null {
  const cursorPositions = Object.values(clickPositions);
  if (cursorPositions.length === 0) {
    return null;
  }

  const cursorPositionClickTimestamps = cursorPositions.map(
    (positions) => positions.clickTimestamp,
  );

  const oldestTimestamp = Math.min(...cursorPositionClickTimestamps);
  // This calculates the delay used for clearing the oldest click position.
  // Add extra 50ms to guard against executing early.
  return Math.max(oldestTimestamp + clickDisplayDuration + 50 - Date.now(), 0);
}

function pruneExpiredClicks(
  clickPositions: Record<string, ClickPosition>,
  clickDisplayDuration: number,
): Record<string, ClickPosition> {
  let didChange = false;

  const newClickPositions = { ...clickPositions };

  Object.entries(clickPositions).forEach(([id, position]) => {
    if (Date.now() >= position.clickTimestamp + clickDisplayDuration) {
      delete newClickPositions[id];
      didChange = true;
    }
  });
  return didChange ? newClickPositions : clickPositions;
}
