import { PagePresence } from '@cord-sdk/react';
import { EXAMPLE_CORD_LOCATION, SAMPLE_GROUP_ID } from '../canvasUtils/common';

export function CanvasHeader() {
  return (
    <div className="canvasHeader">
      <h2>Demos / Cord Canvas Demo_2_FINAL</h2>
      <PagePresence
        groupId={SAMPLE_GROUP_ID}
        location={EXAMPLE_CORD_LOCATION}
      />
    </div>
  );
}
