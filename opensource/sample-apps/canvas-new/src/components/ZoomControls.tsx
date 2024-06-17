import { useCallback, useContext } from 'react';
import classNames from 'classnames';
import { CanvasAndCommentsContext } from '../CanvasAndCommentsContext';

export function ZoomControls() {
  const { canvasStageRef, recomputePinPositions, zoomAndCenter, scale } =
    useContext(CanvasAndCommentsContext)!;

  const zoom = useCallback(
    (type: 'in' | 'out') => {
      if (!canvasStageRef.current) {
        return;
      }

      const scaleBy = 1.25;
      const newScale = type === 'in' ? scale * scaleBy : scale / scaleBy;

      zoomAndCenter({ newScale, animate: true });
      recomputePinPositions();
    },
    [canvasStageRef, zoomAndCenter, recomputePinPositions, scale],
  );

  const zoomIn = useCallback(() => {
    zoom('in');
  }, [zoom]);
  const zoomOut = useCallback(() => {
    zoom('out');
  }, [zoom]);

  return (
    <div className={classNames('zoomControls', 'controlButton')}>
      <button type="button" onClick={zoomOut}>
        -
      </button>
      <span className="scale">{(scale * 100).toFixed(0)}%</span>
      <button type="button" onClick={zoomIn}>
        +
      </button>
    </div>
  );
}
