import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ICellRendererParams, GridApi, ColDef } from 'ag-grid-community';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import { PresenceFacepile, PresenceObserver } from '@cord-sdk/react';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import chartData from '../chartData.json';
import type { GridThreadMetadata } from '../ThreadsContext';
import { ThreadsContext } from '../ThreadsContext';
import { LOCATION, SAMPLE_GROUP_ID } from './Dashboard';
import { ThreadWrapper } from './ThreadWrapper';
import commentIcon from './CommentIcon.svg';
import commentIconResolved from './CommentIconResolved.svg';

export function AGGridExample({ gridId }: { gridId: string }) {
  const gridRef = useRef<AgGridReact>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const onGridReady = useCallback(() => {
    const element = gridContainerRef.current;

    if (!element) {
      return;
    }

    // the grid needs to be manually resized when the page is resized
    const resizeObserver = new ResizeObserver(() => {
      gridRef.current?.api.sizeColumnsToFit();
    });
    resizeObserver.observe(element);
  }, []);

  const {
    openThread,
    addThread,
    setOpenThread,
    threads,
    requestToOpenThread,
    setRequestToOpenThread,
  } = useContext(ThreadsContext)!;

  // Effect to show the correct thread when the user requests to open a
  // specific thread (e.g. by clicking a thread in ThreadList)
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      // this should not happen, appease typechecker
      return;
    }
    const metadata =
      requestToOpenThread !== null
        ? threads.get(requestToOpenThread.threadID)
        : null;
    if (metadata?.type === 'grid' && metadata.gridId === gridId) {
      // this is a request for this grid, make the thread visible
      const { rowId, colId } = metadata;
      const rowNode = grid.api.getRowNode(rowId);

      if (!rowNode) {
        // unknown rowId, may want to take a custom action, such as display
        // thread in a full page modal
        return;
      }

      if (!rowNode.displayed) {
        // remove filters to make sure the row is displayed
        grid.api.setFilterModel(null);
      }
      grid.api.ensureNodeVisible(rowNode); // scroll the table

      // Scroll the page to the table, open the thread and flash the table cell
      gridContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      const onThreadShownCallback = requestToOpenThread?.onThreadShownCallback;

      setRequestToOpenThread(null);

      // Only open the thread if the table is in the viewport because
      // opening the thread immediately currently stops the scrollIntoView().
      const openThreadIfInView = () => {
        const gridContainerBottom =
          gridContainerRef.current?.getBoundingClientRect().bottom;
        const gridContainerTop =
          gridContainerRef.current?.getBoundingClientRect().top;

        if (
          gridContainerBottom &&
          gridContainerTop &&
          // Open the thread if the whole table container is in the viewport
          ((window.innerHeight >= gridContainerBottom &&
            window.innerHeight >= gridContainerTop) ||
            // Also open the thread if the top of the table is outside the viewport
            // to account for window heights smaller than the table height
            gridContainerTop < 0)
        ) {
          grid.api.flashCells({ rowNodes: [rowNode], columns: [colId] });
          clearInterval(intervalID);

          const threadID = requestToOpenThread?.threadID;
          if (threadID) {
            setOpenThread(threadID);
            onThreadShownCallback?.();
          }
        }
      };

      // Check every 150ms to see if we have scrolled the table into view
      const intervalID = setInterval(openThreadIfInView, 150);

      // If for some reason we never open a thread then give up and clean up the setInterval after 2s
      setTimeout(() => clearInterval(intervalID), 2000);
    }
  }, [
    threads,
    gridId,
    requestToOpenThread,
    setOpenThread,
    setRequestToOpenThread,
  ]);

  const openThreadMetadata =
    openThread !== null ? threads.get(openThread) : null;
  const threadOpenOnThisGrid =
    openThreadMetadata?.type === 'grid' && openThreadMetadata.gridId === gridId;
  const { refs, floatingStyles } = useFloating({
    open: threadOpenOnThisGrid,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
    transform: false, // allow Thread to use position: fixed for attachment previews
  });

  const [rowOfOpenThreadVisible, setRowOfOpenThreadVisible] = useState(true);

  // Effect to re-calculate whether the open thread's row is visible
  useEffect(() => {
    if (gridRef.current?.api && threadOpenOnThisGrid) {
      setRowOfOpenThreadVisible(
        // NOTE: same logic is needed for columns if horizontal scrolling is allowed
        isRowInScrollView(gridRef.current.api, openThreadMetadata.rowId),
      );
    }
  }, [threadOpenOnThisGrid, openThread, openThreadMetadata]);

  // This is just boring conversion from "(elem) => void" to ref object
  // "{current: Element}"
  const refSetFloating = useAsRefObject(refs.setFloating);

  const cellRenderer = useCallback(
    (params: ICellRendererParams) =>
      CellWithThreadAndPresence(params, gridId, refs.setReference),
    [gridId, refs.setReference],
  );

  const rowData = useMemo(() => {
    const data: {
      year: number;
      'figma-valuation': string | null;
      'notion-valuation': string | null;
    }[] = [];

    const figmaData = chartData[0].data;
    const notionData = chartData[1].data;
    let currentYear = 2012;

    for (let i = 0; i < figmaData.length; i++) {
      const figmaVal = figmaData[i];
      const notionVal = notionData[i];

      const gridDataRow = {
        year: currentYear,
        'figma-valuation': figmaVal
          ? currencyFormatter(figmaVal * 10000)
          : null,
        'notion-valuation': notionVal
          ? currencyFormatter(notionVal * 10000)
          : null,
      };

      data.push(gridDataRow);
      currentYear++;
    }
    return data;
  }, []);

  return (
    <div
      id="grid-container"
      className={'ag-theme-alpine'}
      ref={gridContainerRef}
    >
      {threadOpenOnThisGrid && (
        <ThreadWrapper
          forwardRef={refSetFloating}
          location={LOCATION}
          threadId={openThread!}
          metadata={openThreadMetadata}
          style={{
            ...floatingStyles, // to position the thread next to the pin
            zIndex: 1, // to be above AgGrid
            // Hide the thread if its row is scrolled out of view.
            // Use css visibility: hidden instead of display: none to hide
            // this thread. display: none would remove the Thread from DOM
            // and thus would lose the draft message.
            visibility: rowOfOpenThreadVisible ? 'visible' : 'hidden',
          }}
        />
      )}
      <AgGridReact
        ref={gridRef}
        getRowId={(params) => getRowId(params.data)}
        rowData={rowData}
        defaultColDef={{
          cellRenderer,
        }}
        columnDefs={COLUMN_DEFS}
        onGridReady={onGridReady}
        suppressRowTransform={true}
        suppressDragLeaveHidesColumns={true}
        onBodyScroll={(e) => {
          // Check if the open thread's row is scrolled out of view
          if (threadOpenOnThisGrid) {
            setRowOfOpenThreadVisible(
              // NOTE: same logic is needed for columns if horizontal scrolling is allowed
              isRowInScrollView(e.api, openThreadMetadata.rowId),
            );
          }
        }}
        onCellClicked={(e) => {
          // On cell click, we might want to open/close/start a thread
          const rowId = getRowId(e.data);
          const colId = e.column.getId();
          const headerName = e.colDef.headerName!;
          const threadId = makeThreadId({
            orgId: SAMPLE_GROUP_ID,
            gridId,
            rowId,
            colId,
          });
          if (threadId === openThread) {
            setOpenThread(null);
          } else if (threads.has(threadId)) {
            setOpenThread(threadId);
          } else {
            const metadata: GridThreadMetadata = {
              type: 'grid',
              headerName,
              gridId,
              rowId,
              colId,
              resolved: false,
            };
            addThread(threadId, metadata);
            setOpenThread(threadId);
          }
        }}
      ></AgGridReact>
    </div>
  );
}

// Custom table cell renderer with presence and thread indicator
function CellWithThreadAndPresence(
  params: ICellRendererParams,
  gridId: string,
  setReference: (el: Element | null) => void,
) {
  const { threads, openThread } = useContext(ThreadsContext)!;
  const rowId = getRowId(params.data);
  const colId = params.column?.getId();
  if (!colId) {
    throw new Error('unexpected error: missing column id');
  }
  const threadId = makeThreadId({
    orgId: SAMPLE_GROUP_ID,
    gridId,
    colId,
    rowId,
  });
  const threadMetadata =
    threadId !== undefined && threadId !== null
      ? threads.get(threadId)
      : undefined;

  const location = useMemo(
    () => ({ gridId, rowId, colId }),
    [colId, gridId, rowId],
  );

  return (
    <>
      <PresenceObserver
        groupId={SAMPLE_GROUP_ID}
        location={location}
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
          title={params.value}
        >
          {params.value}
        </div>
        <PresenceFacepile
          location={location}
          excludeViewer={false}
          maxUsers={1}
        />
        {threadMetadata && threadId && (
          <img
            src={threadMetadata.resolved ? commentIconResolved : commentIcon}
            ref={openThread === threadId ? setReference : undefined}
          />
        )}
      </PresenceObserver>
    </>
  );
}

const COLUMN_DEFS: ColDef[] = [
  {
    field: 'year',
    headerName: 'Year',
    filter: true,
    sortable: true,
  },
  {
    field: 'figma-valuation',
    headerName: 'Figma',
    filter: true,
    sortable: true,
  },
  {
    field: 'notion-valuation',
    headerName: 'Notion',
    filter: true,
    sortable: true,
  },
];

// helper function that converts a function style ref into a ref object
function useAsRefObject(refMethod: (e: HTMLElement | null) => void) {
  return useMemo(() => {
    let val: HTMLElement | null = null;
    return {
      get current() {
        return val;
      },
      set current(element: HTMLElement | null) {
        val = element;
        refMethod(element);
      },
    };
  }, [refMethod]);
}

// Check if row with id rowId is within the scrollable view
function isRowInScrollView(api: GridApi<any>, rowId: string): boolean {
  const rowNode = api.getRowNode(rowId);
  if (
    !rowNode ||
    rowNode.rowTop === null ||
    rowNode.rowHeight === null ||
    rowNode.rowHeight === undefined
  ) {
    return false;
  }
  const { top: visibleTop, bottom: visibleBottom } =
    api.getVerticalPixelRange();
  const rowTop = rowNode.rowTop;
  const rowBottom = rowTop + rowNode.rowHeight;
  // The row spans pixels from rowTop to rowBottom. The grid
  // currently displays pixels from visibleTop to visibleBottom.
  return (
    (rowTop >= visibleTop && rowTop <= visibleBottom) ||
    (rowBottom >= visibleTop && rowBottom <= visibleBottom)
  );
}

// Given data of a table row, returns the row's unique ID
function getRowId(data: { year: number }) {
  return data.year.toString();
}

// Constructs a thread ID
function makeThreadId({
  orgId,
  gridId,
  rowId,
  colId,
}: {
  orgId: string;
  gridId: string;
  rowId: string;
  colId: string;
}) {
  return `${orgId}_${gridId}_${rowId}_${colId}`;
}

// https://blog.ag-grid.com/formatting-numbers-strings-currency-in-ag-grid/
function currencyFormatter(currency: number) {
  const sansDec = currency.toFixed(0);
  const formatted = sansDec.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return '$' + `${formatted}`;
}
