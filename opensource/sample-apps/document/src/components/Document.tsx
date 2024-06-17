import { Thread, presence, PagePresence } from '@cord-sdk/react';
import React, {
  useMemo,
  useRef,
  useCallback,
  useContext,
  useEffect,
  useState,
  Fragment,
} from 'react';
import cx from 'classnames';
import type { ThreadMetadata } from '../ThreadsContext';
import { ThreadsContext } from '../ThreadsContext';
import { useMutationObserver } from '../hooks/useMutationObserver';
import { CommentButton } from './CommentButton';
import { FakeMenu } from './FakeMenuIcon';
import { FloatingPresence } from './FloatingPresence';
import { HIGHLIGHT_ID_DATA_ATTRIBUTE, TextHighlight } from './TextHighlight';
import { AnimatedText } from './AnimatedText';
import { ThreadedCommentsLauncher } from './ThreadedCommentsLauncher';

export const LOCATION = { page: 'document' };
const HOVERED_COMPONENT_ATTRIBUTE_NAME = 'data-hovered-component';
const THREADS_GAP = 16;
export type Coordinates = { top: number; left: number };
export const SAMPLE_GROUP_ID = 'my-first-group';

/**
 * A GDocs clone, powered by Cord.
 */
export function Document() {
  // The comment button is shown after user select some text.
  const [commentButtonCoords, setCommentButtonCoords] = useState<
    Coordinates | undefined
  >();
  // Threads are positioned to the right of the text, just like in GDocs.
  const [threadsPositions, setThreadsPositions] = useState<Coordinates[]>([]);
  // Threads which have been rendered on screen. This is useful because
  // we initially render threads as `hidden`, because we need to know
  // their height to position them correctly.
  const [threadsReady, setThreadsReady] = useState<Set<string>>(new Set());
  const threadsRefs = useRef<(HTMLDivElement | undefined)[] | null>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetContainerBoundingClientRect = useRef<DOMRect | undefined>();
  const titleRef = useRef<HTMLHeadingElement>(null);

  // NOTE: This is used only for the typing effect in cord.com demos.
  // Feel free to ignore/get rid of this part.
  const [animatingElementIndex, setAnimatingElementIndex] = useState(0);
  const [finishedTextAnimation, setFinishedTextAnimation] = useState(false);
  const [isSelectingTextOnSheet, setIsSelectingTextOnSheet] = useState(false);
  const [blockSheetSelection, setBlockSheetSelection] = useState(false);
  const [highlightedComponent, setHighlightedComponent] = useState<
    string | null
  >(null);
  const handleStartAnimatingNextElement = useCallback(
    () => setAnimatingElementIndex((prev) => prev + 1),
    [],
  );

  // We want the sheet to grow as tall as needed, so
  // that threads can never go outside of it.
  const infiniteScrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const handleUpdateContainerHeight = useCallback(() => {
    const bottomMostThread =
      threadsRefs.current?.[threadsRefs.current?.length - 1];
    setContainerHeight(
      window.scrollY + (bottomMostThread?.getBoundingClientRect()?.bottom ?? 0),
    );
  }, []);
  useEffect(() => {
    window.addEventListener('scroll', handleUpdateContainerHeight);
    return () =>
      window.removeEventListener('scroll', handleUpdateContainerHeight);
  }, [handleUpdateContainerHeight]);

  const {
    threads,
    openThread,
    addThread,
    removeThread,
    setOpenThread,
    setFloatingThreadsVisibility,
  } = useContext(ThreadsContext)!;
  const [isEditing, setIsEditing] = useState(false);

  // Sorted from top to bottom as they should appear on screen.
  const sortedThreads = useMemo(() => {
    // You can remove the following line if you are not using the text animation
    // We are using it to re-sort the threads every time a new one is rendered
    threadsReady.size;
    return Array.from(threads).sort(
      ([_aId, { metadata: metadataA }], [_bId, { metadata: metadataB }]) => {
        const firstRectA = getRange(metadataA)?.getClientRects()[0];
        const firstRectB = getRange(metadataB)?.getClientRects()[0];

        // Making sure threads that are not rendered, are always sent to the bottom.
        // They will be re-sorted when they are rendered
        if (!firstRectA || !firstRectB) {
          if (firstRectA) {
            return -1;
          } else if (firstRectB) {
            return 1;
          } else {
            return 0;
          }
        }

        const sortFromTop = firstRectA.top - firstRectB.top;
        const sortFromLeft = firstRectA.left - firstRectB.left;

        // If two highlights are on the same line, we break the tie by checking
        // which one starts the leftmost.
        return sortFromTop === 0 ? sortFromLeft : sortFromTop;
      },
    );
  }, [threadsReady.size, threads]);

  // If users comment on the same line, multiple threads would have the same
  // y (or top) coordinate. However, we don't want threads to overlap, and so
  // we have to manually calculate the positions.
  // Each thread only cares about the thread above itself. And so, if
  // the above thread (top coordinate + height) is over the current thread,
  // we shift the current thread down just enough to not overlap.
  const getThreadsPositions = useCallback(() => {
    if (!threadsRefs.current?.length || !sortedThreads.length) {
      return;
    }

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) {
      return;
    }
    // Recalculating the bounding client rects is a relatively expensive operation,
    // so we opted to only recalculate when repositioning our threads and reuse
    // this value with a ref.
    sheetContainerBoundingClientRect.current =
      containerRef.current?.parentElement?.getBoundingClientRect();

    const [_topThreadId, { metadata }] = sortedThreads[0];
    const newThreadPositions: Coordinates[] = [
      {
        top: getTopPxFromMetadata(metadata),
        left: containerRect.right + THREADS_GAP,
      },
    ];
    for (let i = 1; i < sortedThreads.length; i++) {
      const threadAboveIdx = i - 1;
      const threadAboveTopPx = newThreadPositions[threadAboveIdx].top;
      const threadAboveRef = threadsRefs.current[threadAboveIdx];
      const threadAboveHeight =
        threadAboveRef?.getBoundingClientRect().height ?? 0;
      const [_threadId, { metadata: currentThreadMetadata }] = sortedThreads[i];

      const currentThreadTopPx = getTopPxFromMetadata(currentThreadMetadata);

      const shouldShiftThreadDown =
        newThreadPositions[threadAboveIdx].top +
          threadAboveHeight +
          THREADS_GAP >
        currentThreadTopPx;

      newThreadPositions[i] = {
        top: shouldShiftThreadDown
          ? threadAboveTopPx + threadAboveHeight + THREADS_GAP
          : currentThreadTopPx,
        left: containerRect.right + THREADS_GAP,
      };
    }

    // When users open a thread, scroll all the threads upwards,
    // such that the open thread sits next to the commented line.
    if (openThread) {
      const openThreadIdx = sortedThreads.findIndex(
        ([threadId]) => threadId === openThread,
      );
      const openThreadInitialTopPx = getTopPxFromMetadata(
        sortedThreads[openThreadIdx][1].metadata,
      );
      const openThreadShiftedTopPx = newThreadPositions[openThreadIdx].top;

      if (openThreadInitialTopPx - openThreadShiftedTopPx < 0) {
        const amountShifted = openThreadInitialTopPx - openThreadShiftedTopPx;

        for (const threadPosition of newThreadPositions) {
          threadPosition.top += amountShifted;
        }
      }
    }

    // Floating threads positions is relative to the sheet container, but newThreadPositions
    // were calculated against the viewport, so we need to adjust them.
    const parentTop = sheetContainerBoundingClientRect.current?.top ?? 0;
    const parentLeft = sheetContainerBoundingClientRect.current?.left ?? 0;
    for (let i = 0; i < sortedThreads.length; i++) {
      const top = newThreadPositions[i].top - parentTop;
      const left = newThreadPositions[i].left - parentLeft;

      newThreadPositions[i] = {
        top,
        left,
      };
    }

    return newThreadPositions;
  }, [openThread, sortedThreads]);

  const handleUpdateThreadPositions = useCallback(() => {
    setThreadsPositions((prev) => {
      const newPositions = getThreadsPositions();
      if (newPositions) {
        return newPositions;
      } else {
        return prev;
      }
    });
  }, [getThreadsPositions]);

  // We wil observe each thread's dimension, because if their height
  // changes, we'll want to recompute the thread positions to avoid overlapping.
  const observer = useMemo(() => {
    return new ResizeObserver(handleUpdateThreadPositions);
  }, [handleUpdateThreadPositions]);
  useEffect(() => {
    const threadPos = getThreadsPositions();
    if (threadPos) {
      setThreadsPositions(threadPos);
    }

    return () => observer.disconnect();
  }, [getThreadsPositions, observer, sortedThreads, threadsReady]);

  // Resizing the window should re-adjust the threads' positions
  useEffect(() => {
    window.addEventListener('resize', handleUpdateThreadPositions);

    return () => {
      window.removeEventListener('resize', handleUpdateThreadPositions);
    };
  }, [handleUpdateThreadPositions]);

  const [selectionInitialScrollPosition, setSelectionInitialScrollPosition] =
    useState<Coordinates | undefined>();
  const [currentScroll, setCurrentScroll] = useState<Coordinates | undefined>();

  useEffect(() => {
    const setScroll = () => {
      setCurrentScroll({ top: window.scrollY, left: window.scrollX });
    };

    window.addEventListener('scroll', setScroll);
    return () => {
      window.removeEventListener('scroll', setScroll);
    };
  }, []);

  // When users select text within the page, we want to show a
  // comment button.
  const handleSelection = useCallback(() => {
    const selection = document.getSelection();
    const isSelectionOnSheet =
      selection?.anchorNode?.parentElement?.closest('#sheet') &&
      selection?.focusNode?.parentElement?.closest('#sheet');

    // Ensuring that we can't highlight the sheet when we are
    // highlighting any other part of the demo
    if (selection && !selection.isCollapsed && !isSelectionOnSheet) {
      setBlockSheetSelection(true);
      return;
    }
    setBlockSheetSelection(false);

    if (!selection || selection.isCollapsed || !isSelectionOnSheet) {
      setSelectionInitialScrollPosition(undefined);
      setCommentButtonCoords(undefined);
      setIsSelectingTextOnSheet(false);

      return;
    }

    const hasSelectedText = selection.toString().trim().length > 0;
    if (hasSelectedText) {
      setIsSelectingTextOnSheet(true);
      const range = selection.getRangeAt(0);
      const { top, left } = range.getClientRects()[0];
      setSelectionInitialScrollPosition({
        top: window.scrollY,
        left: window.scrollX,
      });
      setCommentButtonCoords({
        top: top,
        left: left,
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [handleSelection]);

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

  // Adding an initial text selection, to showcase the "Add comment" button.
  // This useEffect is not necessary if you are building this yourself!
  useEffect(() => {
    if (finishedTextAnimation && titleRef.current) {
      const selection = document.getSelection();
      const selectionRange = document.createRange();
      // Selecting the "Looks like" text from the title
      selectionRange.setStart(titleRef.current.childNodes[0], 0);
      selectionRange.setEnd(titleRef.current.childNodes[0], 10);

      // If a user clicks anywhere, even before this useEffect runs,
      // the selection object gets populated. Multiple ranges are not
      // supported in all browsers, but they are in this API. So we are
      // clearing any ranges before adding this selection to make sure
      // it's displayed.
      selection?.removeAllRanges();
      selection?.addRange(selectionRange);
    }
  }, [finishedTextAnimation]);

  const presentUsers = presence.useLocationData(LOCATION, {
    partial_match: true,
    exclude_durable: true,
  });
  // When users hover on an element, we mark them as present
  // on that element, and mark them as absent from everywhere else.
  // We do so by checking the element.id.
  const handleMouseOver = useCallback((e: MouseEvent) => {
    if (!window.CordSDK) {
      return;
    }

    const toElement = e.target;
    if (
      !toElement ||
      !(toElement instanceof HTMLElement) ||
      !toElement.id.length ||
      toElement.id === 'sheet'
    ) {
      return;
    }

    void window.CordSDK.presence.setPresent(
      {
        ...LOCATION,
        elementId: toElement.id,
      },
      // This makes a user present only in one place within LOCATION.
      // E.g. when hovering the title, the user will be marked absent
      // everywhere else.
      { exclusive_within: LOCATION, groupID: SAMPLE_GROUP_ID },
    );
  }, []);

  // The following useEffect hook only exists for the Cord demo
  // It is not necessary if you are building this yourself!
  // Sets the user present on the title to temporarily
  // show the avatar component when it is highlighted.
  useEffect(() => {
    if (!window.CordSDK || highlightedComponent !== 'cord-avatar') {
      return;
    }

    void window.CordSDK.presence.setPresent(
      {
        ...LOCATION,
        elementId: 'title',
      },

      { exclusive_within: LOCATION, groupID: SAMPLE_GROUP_ID },
    );
  }, [highlightedComponent]);

  useEffect(() => {
    const { current: sheet } = containerRef;
    if (!sheet) {
      return;
    }

    sheet.addEventListener('mouseover', handleMouseOver);

    return () => {
      sheet.removeEventListener('mouseover', handleMouseOver);
    };
  }, [handleMouseOver]);

  // When adding a comment, we want to save enough metadata to be able to
  // then recreate a `Range`. We can leverage the `Range` to draw highlights
  // over the text, and have the browser compute their position for us.
  const addComment = useCallback(() => {
    const range = window.getSelection()?.getRangeAt(0);
    if (!range) {
      return;
    }
    const { startContainer, endContainer, startOffset, endOffset } = range;
    const startElement =
      startContainer instanceof HTMLElement
        ? startContainer
        : startContainer.parentElement;
    const endElement =
      endContainer instanceof HTMLElement
        ? endContainer
        : endContainer.parentElement;

    if (!startElement || !endElement) {
      console.warn(`Couldn't add a comment: missing start and end element.`);
      return;
    }

    const metadata = {
      // For simplicity, we've added an id to our elements. This
      // makes it easy to retrieve the HTMLElement when we need to render
      // the threads on screen.
      startNodeId: startElement.id,
      endNodeId: endElement.id,
      startOffset,
      endOffset,
      floatingThreadVisible: true,
    } as const;
    const threadId = crypto.randomUUID();
    addThread(threadId, metadata, 0);
    setOpenThread(threadId);
  }, [addThread, setOpenThread]);

  const handleHideFloatingThread = useCallback(
    (threadId: string) => {
      setFloatingThreadsVisibility(threadId, false);
      setOpenThread(null);
    },
    [setOpenThread, setFloatingThreadsVisibility],
  );

  const handleRemoveFloatingThread = useCallback(
    (threadId: string) => {
      setThreadsReady((prev) => {
        const newThreads = new Set([...prev]);
        newThreads.delete(threadId);
        return newThreads;
      });
      removeThread(threadId);
      setOpenThread(null);
    },
    [removeThread, setOpenThread],
  );

  // Improving the UX: Clicking Escape should close the currently open thread.
  const handleClickEsc = useCallback(
    (e: KeyboardEvent) => {
      if (!openThread || e.key !== 'Escape') {
        return;
      }

      if (openThread && threads.get(openThread)?.totalMessages === 0) {
        handleRemoveFloatingThread(openThread);
      } else {
        setOpenThread(null);
      }
    },
    [handleRemoveFloatingThread, openThread, setOpenThread, threads],
  );
  useEffect(() => {
    document.addEventListener('keydown', handleClickEsc);

    return () => {
      document.removeEventListener('keydown', handleClickEsc);
    };
  }, [handleClickEsc]);

  const newCommentButtonCoords = commentButtonCoords
    ? {
        left:
          commentButtonCoords.left +
          (selectionInitialScrollPosition?.left ?? 0) -
          (currentScroll?.left ?? 0),
        top:
          commentButtonCoords.top +
          (selectionInitialScrollPosition?.top ?? 0) -
          (currentScroll?.top ?? 0),
      }
    : undefined;

  // Clicking on a text highlight should open the relative
  // thread. We enable this with an `click` listener.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!window.getSelection()?.isCollapsed) {
        return;
      }

      const highlightId = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((el) => el.matches(`[${HIGHLIGHT_ID_DATA_ATTRIBUTE}]`))
        ?.getAttribute(HIGHLIGHT_ID_DATA_ATTRIBUTE);
      if (highlightId) {
        setOpenThread(highlightId);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });

  return (
    <>
      {newCommentButtonCoords && (
        <CommentButton coords={newCommentButtonCoords} onClick={addComment} />
      )}
      <div
        className="container-frame"
        ref={infiniteScrollContainerRef}
        style={{ height: containerHeight }}
      >
        <div
          id="sheet-container"
          className={cx('container', {
            ['blockSelection']: isSelectingTextOnSheet,
          })}
        >
          <div className="header">
            <FakeMenu />
            <div className="header-subgroup">
              <ThreadedCommentsLauncher />
              <PagePresence location={LOCATION} groupId={SAMPLE_GROUP_ID} />
            </div>
          </div>
          <hr />
          <div
            className={cx({
              ['floating-thread-is-open']: openThread !== null,
            })}
          >
            {sortedThreads
              // only display threads we have marked as visible
              .filter(([_id, { metadata }]) => metadata.floatingThreadVisible)
              .map(([threadId, { metadata }], threadIdx) => {
                const range = getRange(metadata);
                if (!range) {
                  return;
                }

                // We need to calculate offsets as the parent container
                // is relatively positioned
                sheetContainerBoundingClientRect.current =
                  containerRef.current?.parentElement?.getBoundingClientRect();
                const offsetTop =
                  sheetContainerBoundingClientRect.current?.top ?? 0;
                const offsetLeft =
                  sheetContainerBoundingClientRect.current?.left ?? 0;

                const selectionRectsVsViewport = [...range.getClientRects()];
                const isOpenThread = openThread === threadId;

                return (
                  <Fragment key={threadId}>
                    {selectionRectsVsViewport.map((rect, idx) => (
                      <TextHighlight
                        rect={{
                          // Getting the DOMRect object as a JSON so
                          // we can spread its properties and easily
                          // modify the top and left properties with
                          // the values we just calculated a few lines
                          // above.
                          ...rect.toJSON(),
                          top: rect.top - offsetTop,
                          left: rect.left - offsetLeft,
                        }}
                        key={idx}
                        isOpenThread={isOpenThread}
                        threadId={threadId}
                      />
                    ))}
                    <div
                      ref={(el: HTMLDivElement) => {
                        if (threadsRefs?.current && el) {
                          threadsRefs.current[threadIdx] = el;
                          observer.observe(el);
                        }
                      }}
                      className={cx('floating-thread-container', {
                        ['open']: openThread === threadId,
                      })}
                      onClick={() => {
                        setOpenThread(threadId);
                        // Threads grow vertically. Very long threads might get
                        // far away from the sheet's content, in which case, move them up!
                        const isBottomThreadTooFarDown =
                          threadsPositions[threadsPositions.length - 1].top >
                          window.innerHeight;
                        if (isBottomThreadTooFarDown) {
                          window.scrollTo({ top: 0 });
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left:
                          (threadsPositions[threadIdx]?.left ??
                            // Make threads slide in from the right
                            containerRef.current?.getBoundingClientRect()
                              .right ??
                            0) +
                          (isOpenThread ? -THREADS_GAP * 2 : THREADS_GAP),
                        top:
                          threadsPositions[threadIdx]?.top ??
                          getTopPxFromMetadata(metadata),
                        transition: 'all 0.5s ease 0.1s',
                        transitionProperty: 'top, left',
                        // The first time the thread gets rendered it's `hidden`, but
                        // it has the right height. Once we know its height, we mark it
                        // as ready, and we can correctly compute the position of the  thread
                        //  below it.
                        visibility: threadsReady.has(threadId)
                          ? 'visible'
                          : 'hidden',
                      }}
                    >
                      <Thread
                        groupId={SAMPLE_GROUP_ID}
                        location={LOCATION}
                        threadId={threadId}
                        metadata={metadata}
                        className={isOpenThread ? 'open-thread' : undefined}
                        showPlaceholder={false}
                        composerExpanded={isOpenThread}
                        // When editing a message and focusing an open thread,
                        // we don't want the main composer of the thread to
                        // steal the focus from the editing composer.
                        autofocus={isOpenThread && !isEditing}
                        onRender={() =>
                          setThreadsReady(
                            (prev) => new Set([...prev, threadId]),
                          )
                        }
                        onResolved={() => {
                          handleHideFloatingThread(threadId);
                        }}
                        onClose={() => {
                          setOpenThread(null);
                        }}
                        onThreadInfoChange={({ messageCount }) => {
                          const userDeletedLastMessage =
                            messageCount === 0 && threadsReady.has(threadId);
                          if (userDeletedLastMessage) {
                            handleHideFloatingThread(threadId);
                          }
                        }}
                        onMessageEditStart={() => {
                          setOpenThread(threadId);
                          setIsEditing(true);
                        }}
                        onMessageEditEnd={() => setIsEditing(false)}
                      />
                    </div>
                  </Fragment>
                );
              })}
          </div>
          {/* Used to catch clicks outside the thread, and close it. */}
          <div
            className={cx('click-underlay', {
              ['show']: openThread,
            })}
            onClick={() => {
              if (openThread && threads.get(openThread)?.totalMessages === 0) {
                handleRemoveFloatingThread(openThread);
              } else {
                setOpenThread(null);
              }
            }}
          />
          {/* The actual contents of the sheet. If you're planning on building your own,
        you can safely remove AnimatedText. The key requirement for every element is to have an ID.
        E.g. <h1 id="title">My Shiny App</h1><p id="content">My Shiny content</p> will work. */}
          <div
            id="sheet"
            ref={containerRef}
            className={cx({
              ['blockSelection']: blockSheetSelection,
            })}
          >
            <FloatingPresence presentUsers={presentUsers} />
            <h1 id="title" ref={titleRef}>
              <AnimatedText
                typingUser="Albert"
                animate={!document.hidden && animatingElementIndex === 0}
                text="Looks like Google Docs, right?"
                onComplete={handleStartAnimatingNextElement}
              />
            </h1>
            <p id="p1">
              <AnimatedText
                typingUser="Albert"
                animate={!document.hidden && animatingElementIndex === 1}
                text="We built this commenting experience with Cord's SDK, and you can, too 👍"
                onComplete={handleStartAnimatingNextElement}
              />
            </p>
            <p id="p2">
              <AnimatedText
                typingUser="Albert"
                animate={!document.hidden && animatingElementIndex === 2}
                text="Go on, give it a try! Don't worry, your comments won't be visible to anyone else visiting the site."
                onComplete={() => setFinishedTextAnimation(true)}
              />
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Given ThreadMetadata, build a Range. This is very useful to
 * render the highlight over the text, by leveraging native browser
 * APIs.
 */
function getRange(metadata: ThreadMetadata) {
  const startElement = document.getElementById(metadata.startNodeId);
  const endElement = document.getElementById(metadata.endNodeId);

  if (!startElement || !endElement) {
    return;
  }
  const startNode = startElement.firstChild;
  const endNode = endElement.firstChild;
  if (!startNode || !endNode) {
    return;
  }
  const range = document.createRange();

  try {
    range.setStart(startNode, metadata.startOffset);
    range.setEnd(endNode, metadata.endOffset);
  } catch (error) {
    // setEnd throws if we pass an offset greater than the node length.
    // E.g. user selects 100 chars, text gets edited to only have 50 chars.
    return null;
  }

  return range;
}

function getTopPxFromMetadata(metadata: ThreadMetadata) {
  return getRange(metadata)?.getBoundingClientRect().top ?? 0;
}
