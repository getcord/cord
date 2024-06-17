import { AddCommentIcon } from './AddCommentIcon';
import type { Coordinates } from './Document';

const COMMENT_BUTTON_MARGIN_PX = 4;

export function CommentButton({
  coords,
  onClick,
}: {
  coords: Coordinates;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="comment-button"
      style={{
        top: coords.top,
        left: coords.left,
        transform: `translateY(calc(-100% - ${COMMENT_BUTTON_MARGIN_PX}px))`,
      }}
      onClick={onClick}
    >
      <AddCommentIcon />
      <span style={{ userSelect: 'none' }}>Add comment</span>
    </button>
  );
}
