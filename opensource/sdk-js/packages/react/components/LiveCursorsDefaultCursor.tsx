import * as React from 'react';
import { useMemo } from 'react';
import cx from 'classnames';

import type {
  ClientUserData,
  LiveCursorsCursorPosition,
} from '@cord-sdk/types';
import * as classes from './LiveCursors.classnames.js';
import { Icon } from './helpers/Icon.js';
import { Avatar } from './Avatar.js';

type CursorPosition = NonNullable<LiveCursorsCursorPosition>;

export type LiveCursorsCursorProps = {
  /**
   * User controlling this cursor.
   */
  user: ClientUserData;

  /**
   * The position of the user's cursor in viewport-relative coordinates.
   */
  pos: CursorPosition;
  className?: string;
};

// Map userIDs to stable class name and apply colors with CSS.
const TOTAL_NUM_OF_PALETTES = 8;
export function getStableColorPaletteID(userId: string) {
  let simpleHash = 0;
  for (const char of userId) {
    simpleHash += char.charCodeAt(0);
  }
  return (simpleHash % TOTAL_NUM_OF_PALETTES) + 1; // 1-indexed;
}

export function LiveCursorsDefaultCursor({
  user,
  pos,
  className,
  ...otherProps
}: LiveCursorsCursorProps) {
  const cursorPaletteID = useMemo(
    () => getStableColorPaletteID(user.id),
    [user.id],
  );

  return (
    <div
      className={cx(classes.cursor, className, [
        `${classes.colorPalette}-${cursorPaletteID}`,
      ])}
      style={{
        left: pos.viewportX + 'px',
        top: pos.viewportY + 'px',
      }}
      {...otherProps}
    >
      <Icon className={classes.icon} name="Cursor" size="large" />
      <div className={classes.label}>
        {user.profilePictureURL && <Avatar userId={user.id} />}
        <span className={classes.name}>{user.name}</span>
      </div>
    </div>
  );
}

export function LiveCursorsDefaultClick({
  user,
  pos,
  className,
  ...otherProps
}: LiveCursorsCursorProps) {
  const cursorPaletteID = useMemo(
    () => getStableColorPaletteID(user.id),
    [user.id],
  );

  return (
    <div
      style={{
        left: pos.viewportX + 'px',
        top: pos.viewportY + 'px',
      }}
      className={cx([className, `${classes.colorPalette}-${cursorPaletteID}`], {
        [classes.cursorClick]: pos.click,
      })}
      {...otherProps}
    ></div>
  );
}
