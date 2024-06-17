import type { UserLocationData } from '@cord-sdk/types';
import { Avatar } from '@cord-sdk/react';

const AVATARS_GAP = 12;
/**
 * Adds an avatar next to the element where the user is present.
 */
export function FloatingPresence({
  presentUsers,
}: {
  presentUsers: UserLocationData[] | undefined;
}) {
  return (
    <>
      {presentUsers?.map((u, idx) => {
        const { locations } = u.ephemeral;
        // We made it so user can only be at one location at a time.
        const elementId = (locations?.[0]?.elementId ?? '') as string;
        const element = document.getElementById(elementId);
        // Since we are using `position: absolute`, we need the closest
        // relatively-positioned element to correctly position the avatar
        const parentElement = document.getElementById('sheet-container');
        const elementRectVsViewport = element?.getBoundingClientRect();
        const parentElementRectVsViewport =
          parentElement?.getBoundingClientRect();

        if (!elementRectVsViewport || !parentElementRectVsViewport) {
          return null;
        }
        const { top, left, height } = elementRectVsViewport;
        const { top: offsetTop, left: offsetLeft } =
          parentElementRectVsViewport;
        return (
          <Avatar
            key={u.id}
            userId={u.id}
            style={{
              position: 'absolute',
              top: top - offsetTop + height / 2, // Move it to the middle of the line.
              transform: 'translateY(-50%)', // Center it visually.
              left:
                left -
                offsetLeft -
                AVATARS_GAP * 2 - // Move it to the left of the text
                idx * AVATARS_GAP, // Move each avatar a bit more to the left
              zIndex: 1,
              transition: 'top  0.25s ease 0.1s',
              visibility:
                !elementId || locations.length <= 0 ? 'hidden' : 'visible',
            }}
          />
        );
      })}
    </>
  );
}
