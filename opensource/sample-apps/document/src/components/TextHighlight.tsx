import type { CSSProperties } from 'react';

export const HIGHLIGHT_ID_DATA_ATTRIBUTE = 'data-highlight-id';

/**
 * The yellow rectangle below the text, giving the highlight effect.
 */
export function TextHighlight({
  rect,
  isOpenThread,
  threadId,
}: {
  rect: DOMRect;
  isOpenThread: boolean;
  threadId: string;
}) {
  const rectPosition = {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    position: 'absolute',
  } as CSSProperties;
  return (
    <div
      {...{ [HIGHLIGHT_ID_DATA_ATTRIBUTE]: threadId }}
      style={{
        ...rectPosition,
        background: isOpenThread ? '#F5BE4D' : '#FDF2D7',
      }}
    />
  );
}
