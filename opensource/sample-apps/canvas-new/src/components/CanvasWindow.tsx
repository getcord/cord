import Canvas from './Canvas';
import { CanvasHeader } from './CanvasHeader';

export function CanvasWindow() {
  return (
    <div className="canvasWindow">
      <CanvasHeader />
      <Canvas />
    </div>
  );
}
