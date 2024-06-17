import { Stage, Layer, Rect, Circle, Text, Star } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import cx from 'classnames';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { LiveCursors } from '@cord-sdk/react';
import type { Location } from '@cord-sdk/types';
import { CanvasAndCommentsContext } from '../CanvasAndCommentsContext';
import type { ThreadMetadata } from '../canvasUtils/common';
import {
  EXAMPLE_CORD_LOCATION,
  getStageData,
  SAMPLE_GROUP_ID,
} from '../canvasUtils/common';
import { createNewPin } from '../canvasUtils/pin';
import { CommentIcon } from './CommentIcon';
import { CanvasCommentsList } from './CanvasCommentsList';
import {
  CustomArrow,
  CustomHeart,
  CustomSparkle,
  CustomSquiggle,
} from './CustomShapes';
import { ZoomControls } from './ZoomControls';
import { CanvasComments } from './CanvasComments';

const LIST_OF_CANVAS_SHAPES = [
  'square',
  'circle',
  'star',
  'prompt-text',
  'custom-arrow',
  'custom-squiggle',
  'custom-sparkle',
  'custom-heart',
];

export default function Canvas() {
  const {
    canvasStageRef,
    canvasContainerRef,
    openThread,
    setOpenThread,
    inThreadCreationMode,
    setInThreadCreationMode,
    removeThreadIfEmpty,
    addThread,
    setIsPanningCanvas,
    isPanningCanvas,
    recomputePinPositions,
    zoomAndCenter,
    scale,
  } = useContext(CanvasAndCommentsContext)!;

  const timeoutPanningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasAndCordContainerRef = useRef<HTMLDivElement>(null);

  const updateCanvasSize = useCallback(() => {
    const stage = canvasStageRef.current;
    if (!canvasContainerRef.current || !stage) {
      return;
    }
    stage.size({
      width: canvasContainerRef.current.clientWidth,
      height: canvasContainerRef.current.clientHeight,
    });
  }, [canvasContainerRef, canvasStageRef]);

  useEffect(() => {
    // Sets the canvas stage initially
    updateCanvasSize();
  }, [updateCanvasSize]);

  useEffect(() => {
    // When window resizes, resize canvas
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [updateCanvasSize]);

  useEffect(() => {
    const preventBrowserNavigation = (e: WheelEvent) => {
      if (e.target instanceof HTMLCanvasElement) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', preventBrowserNavigation, {
      passive: false,
    });
    return window.removeEventListener('wheel', preventBrowserNavigation);
  }, []);

  const onStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      removeThreadIfEmpty(openThread);
      setOpenThread(null);
      if (!inThreadCreationMode) {
        return;
      }
      e.evt.preventDefault();
      e.evt.stopPropagation();

      if (!canvasStageRef.current) {
        return;
      }
      const { x: relativeX, y: relativeY } =
        e.target.getRelativePointerPosition();

      const elementPosition = e.target.getPosition();

      const { stageX, stageY, stagePointerPosition } = getStageData(
        canvasStageRef.current,
      );

      const elementName = e.target.attrs.name;

      if (
        elementName !== 'stage' &&
        !LIST_OF_CANVAS_SHAPES.includes(elementName)
      ) {
        return;
      }

      e.target.stopDrag();

      let x, y: number;
      if (elementName === 'stage') {
        x = stagePointerPosition.x;
        y = stagePointerPosition.y;
      } else {
        x = stageX + (elementPosition.x + relativeX) * scale;
        y = stageY + (elementPosition.y + relativeY) * scale;
      }

      const threadMetadata: ThreadMetadata = {
        relativeX,
        relativeY,
        elementName,
      };

      const pin = createNewPin({
        threadMetadata,
        x,
        y,
      });

      addThread(pin.threadID, pin);

      setOpenThread({ threadID: pin.threadID, empty: true });
      setInThreadCreationMode(false);
    },
    [
      addThread,
      canvasStageRef,
      inThreadCreationMode,
      openThread,
      removeThreadIfEmpty,
      scale,
      setInThreadCreationMode,
      setOpenThread,
    ],
  );

  const onEscapePress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInThreadCreationMode(false);
        removeThreadIfEmpty(openThread);
        setOpenThread(null);
      }
    },
    [openThread, removeThreadIfEmpty, setInThreadCreationMode, setOpenThread],
  );

  useEffect(() => {
    window.addEventListener('keydown', onEscapePress);
    return () => window.removeEventListener('keydown', onEscapePress);
  }, [onEscapePress]);

  const onStageWheel = useCallback(
    ({ evt }: KonvaEventObject<WheelEvent>) => {
      evt.preventDefault();

      if (!isPanningCanvas) {
        setIsPanningCanvas(true);
      }
      // Improving the panning experience over canvas
      if (timeoutPanningRef.current !== null) {
        clearTimeout(timeoutPanningRef.current);
      }
      timeoutPanningRef.current = setTimeout(
        () => setIsPanningCanvas(false),
        300,
      );

      const isPinchToZoom = evt.ctrlKey;
      const stage = canvasStageRef.current;
      if (!stage) {
        return;
      }
      if (isPinchToZoom) {
        // https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html
        const scaleBy = 1.03;
        let direction = evt.deltaY > 0 ? 1 : -1;
        // When we zoom on trackpads,
        // e.evt.ctrlKey is true so in that case lets revert direction.
        if (evt.ctrlKey) {
          direction = -direction;
        }
        const newScale = direction > 0 ? scale * scaleBy : scale / scaleBy;
        const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };
        const mousePointTo = {
          x: (pointer.x - stage.x()) / scale,
          y: (pointer.y - stage.y()) / scale,
        };

        const center = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };

        zoomAndCenter({ newScale, center });
      } else {
        // Just panning the canvas
        const { deltaX, deltaY } = evt;
        const { x, y } = stage.getPosition();
        stage.position({ x: x - deltaX, y: y - deltaY });
      }
      recomputePinPositions();
    },
    [
      isPanningCanvas,
      setIsPanningCanvas,
      canvasStageRef,
      recomputePinPositions,
      scale,
      zoomAndCenter,
    ],
  );

  const onElementDrag = useCallback(
    (_e: KonvaEventObject<DragEvent>) => {
      const stage = canvasStageRef.current;
      if (!stage) {
        return;
      }

      recomputePinPositions();
      removeThreadIfEmpty(openThread);
      setOpenThread(null);
    },
    [
      canvasStageRef,
      openThread,
      recomputePinPositions,
      removeThreadIfEmpty,
      setOpenThread,
    ],
  );

  const dragProps = {
    draggable: !inThreadCreationMode,
    onDragMove: onElementDrag,
  };

  return (
    <div className="canvasAndCordContainer" ref={canvasAndCordContainerRef}>
      <div className="canvasContainer" ref={canvasContainerRef}>
        <Stage
          id="stage"
          ref={canvasStageRef}
          className={cx({
            ['commentingModeCursor']: inThreadCreationMode,
          })}
          name="stage"
          onClick={onStageClick}
          onWheel={onStageWheel}
          width={window.innerWidth}
          height={window.innerHeight}
        >
          <Layer>
            <Circle
              radius={250}
              fill="#0ACF83"
              x={890}
              y={85}
              name="circle"
              {...dragProps}
            />
            <Rect
              fill={'#FA7351'}
              width={400}
              height={400}
              x={-200}
              y={24}
              name="square"
              {...dragProps}
            />
            <CustomArrow x={330} y={85} name="custom-arrow" {...dragProps} />
            <CustomSparkle x={810} y={0} name="custom-sparkle" {...dragProps} />
            <CustomSquiggle
              x={450}
              y={170}
              name="custom-squiggle"
              {...dragProps}
            />
            <Star
              numPoints={5}
              lineJoin="round"
              fill={'#FFC700'}
              outerRadius={20}
              innerRadius={10}
              stroke={'#FFFFFF'}
              strokeWidth={4}
              x={580}
              y={420}
              name="star"
              shadowColor={'rgba(0, 0, 0, 0.12)'}
              shadowOffset={{
                x: 0,
                y: 2,
              }}
              shadowBlur={3}
              {...dragProps}
            />
            <Text
              text="Try adding a comment here!"
              name="prompt-text"
              {...dragProps}
              fontSize={16}
              x={580}
              y={440}
              rotation={-5}
              draggable={!inThreadCreationMode}
              onDragMove={onElementDrag}
            />
            <CustomHeart x={850} y={450} name="custom-heart" {...dragProps} />
          </Layer>
        </Stage>
        <LiveCursors
          groupId={SAMPLE_GROUP_ID}
          location={EXAMPLE_CORD_LOCATION}
          boundingElementRef={canvasContainerRef}
          translations={{
            eventToLocation: () => {
              const stage = canvasStageRef.current;
              if (!stage) {
                return null;
              }
              const stageRelativePointerPosition =
                stage.getRelativePointerPosition();

              return {
                x: stageRelativePointerPosition.x,
                y: stageRelativePointerPosition.y,
              };
            },
            locationToDocument: (location: Location) => {
              const stage = canvasStageRef.current;
              const canvasAndCordContainer = canvasAndCordContainerRef.current;
              if (
                !stage ||
                !canvasAndCordContainer ||
                !location ||
                !location.x ||
                !location.y
              ) {
                return null;
              }

              const transform = stage.getTransform();
              const transformedCoords = transform.point({
                x: location.x as number,
                y: location.y as number,
              });

              return {
                viewportX:
                  canvasAndCordContainer.offsetLeft + transformedCoords.x,
                viewportY:
                  canvasAndCordContainer.offsetTop + transformedCoords.y,
                click: false,
              };
            },
          }}
        />
        <div className="canvasButtonGroup">
          <button
            className="controlButton"
            type="button"
            onClick={() => {
              setInThreadCreationMode((prev) => !prev);
              removeThreadIfEmpty(openThread);
            }}
          >
            <CommentIcon />
            <span>{inThreadCreationMode ? 'Cancel' : 'Add Comment'}</span>
          </button>
          <ZoomControls />
        </div>
        <CanvasComments />
      </div>
      <CanvasCommentsList />
    </div>
  );
}
