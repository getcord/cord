import type { MutableRefObject } from 'react';
import { useState, useContext, useEffect, useCallback } from 'react';
import {
  PagePresence,
  NotificationListLauncher,
  CordContext,
} from '@cord-sdk/react';
import type { NavigateFn } from '@cord-sdk/types';

import { ThreadsContext } from '../ThreadsContext';
import { useMutationObserver } from '../hooks/useMutationObserver';
import { HighchartsExample } from './HighchartsExample';
import { AGGridExample } from './AGGridExample';
import { ThreadedCommentsButton } from './ThreadedCommentsButton';

export const LOCATION = { page: 'dashboard' };
export const CHART_ID = 'some-unique-and-stable-id-of-this-chart';
export const GRID_ID = 'some-unique-and-stable-id-of-this-grid';
const TOP_LEFT_CELL_LOCATION = {
  gridId: GRID_ID,
  rowId: '2012',
  colId: 'year',
};
const HOVERED_COMPONENT_ATTRIBUTE_NAME = 'data-hovered-component';
export const SAMPLE_GROUP_ID = 'my-first-group';

function Dashboard({
  navigateRef,
  highchartsDataSeries,
}: {
  navigateRef: MutableRefObject<NavigateFn | null>;
  highchartsDataSeries?: { start: number; end: number }[];
}) {
  const { sdk: cordSDK } = useContext(CordContext);
  const { openThread, setOpenThread, setRequestToOpenThread } =
    useContext(ThreadsContext)!;
  const [highlightedComponent, setHighlightedComponent] = useState<
    string | null
  >(null);

  useEffect(() => {
    navigateRef.current = (_url, _location, { threadID }) => {
      // Since our app is an SPA, we don't need to actually navigate to a
      // specific URL, but rather can just open up the indicated thread ID. We
      // then return "true" to tell Cord that we have handled the navigation and
      // it doesn't need to proceed to the actual URL navigation.
      //
      // Full documentation on the navigate hook is here:
      // https://docs.cord.com/js-apis-and-hooks/initialization#navigate-3
      setRequestToOpenThread({ threadID });
      return true;
    };
  }, [navigateRef, setRequestToOpenThread]);

  // Effect to close open thread on ESCAPE key press and also stop thread
  // creation mode
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenThread(null);
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [setOpenThread]);

  // Effect to close thread if user clicks anywhere but a Pin or Thread
  useEffect(() => {
    if (openThread) {
      const close = (event: MouseEvent) => {
        if (
          !event.composedPath().some((e) => {
            if (e instanceof Element) {
              const elName = e.tagName.toLowerCase();
              return elName === 'cord-pin' || elName === 'cord-thread';
            }
            return false;
          })
        ) {
          // user clicked somewhere that's not the pin nor thread
          setOpenThread(null);
        }
      };
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }
    return () => {};
  }, [openThread, setOpenThread]);

  // The following callback and useMutationObserver hook only
  // exist for the Cord demo.
  // It is not necessary if you are building this yourself!
  const rootDiv = document.getElementById('root');
  const handleHoveredAttributeChange: MutationCallback = useCallback(
    (mutations: MutationRecord[]) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === HOVERED_COMPONENT_ATTRIBUTE_NAME &&
          rootDiv
        ) {
          const attributeValue = rootDiv.getAttribute(
            HOVERED_COMPONENT_ATTRIBUTE_NAME,
          );
          setHighlightedComponent(attributeValue);
        }
      });
    },
    [rootDiv],
  );
  useMutationObserver(rootDiv, handleHoveredAttributeChange);

  const [threadListOpen, setThreadListOpen] = useState(false);

  // The following useEffect hook only exists for the Cord demo
  // It is not necessary if you are building this yourself!
  // Sets the user present on the top left cell of the grid to
  // temporarily show the avatar component when it is highlighted.
  useEffect(() => {
    function setDemoPresence(absent: boolean) {
      if (!cordSDK) {
        return;
      }
      void cordSDK.presence.setPresent(
        {
          ...TOP_LEFT_CELL_LOCATION,
        },
        {
          groupID: SAMPLE_GROUP_ID,
          exclusive_within: TOP_LEFT_CELL_LOCATION,
          absent,
        },
      );
    }

    const markAbsent =
      highlightedComponent !== 'cord-presence-observer' &&
      highlightedComponent !== 'cord-presence-facepile';

    setDemoPresence(markAbsent);
  }, [cordSDK, highlightedComponent]);

  return (
    <>
      <div id="dashboard">
        <div className="grid highcharts">
          <div className="header">
            <h1>Your collaborative dashboard</h1>
            <div id="collaboration">
              <ThreadedCommentsButton
                open={threadListOpen}
                setOpen={setThreadListOpen}
              />
              <PagePresence location={LOCATION} groupId={SAMPLE_GROUP_ID} />
              <NotificationListLauncher
                onClick={() => setThreadListOpen(false)}
                // Remove this if you want all notifications from all locations
                filter={{ location: { page: 'dashboard' } }}
              />
            </div>
          </div>
          <div className="panel">
            <HighchartsExample
              chartId={CHART_ID}
              highchartsDataSeries={highchartsDataSeries}
            />
          </div>

          <AGGridExample gridId={GRID_ID} />
        </div>
      </div>
    </>
  );
}

export default Dashboard;
