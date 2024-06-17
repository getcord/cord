import cx from 'classnames';

import * as React from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { ArrowUpIcon as ArrowUp } from '../../common/icons/customIcons/ArrowUpIcon.js';
import { ArrowRightIcon as ArrowRight } from '../../common/icons/customIcons/ArrowRightIcon.js';
import { HelpIcon as Help } from '../../common/icons/customIcons/HelpIcon.js';
import { AddEmojiIcon as AddEmoji } from '../../common/icons/customIcons/AddEmojiIcon.js';
import { AnnotationPinIcon as AnnotationPin } from '../../common/icons/customIcons/AnnotationPinIcon.js';
import { AssignIcon as Assign } from '../../common/icons/customIcons/AssignIcon.js';
import { ChatAddIcon as ChatAdd } from '../../common/icons/customIcons/ChatAddIcon.js';
import { CrossIcon as Cross } from '../../common/icons/customIcons/CrossIcon.js';
import { CursorIcon as Cursor } from '../../common/icons/customIcons/CursorIcon.js';
import { SlackIcon as Slack } from '../../common/icons/customIcons/SlackIcon.js';
// eslint-disable-next-line @cspell/spellchecker
import { SlackColourIcon as SlackColour } from '../../common/icons/customIcons/SlackColourIcon.js';
import { AsanaIcon as Asana } from '../../common/icons/customIcons/AsanaIcon.js';
import { LinearIcon as Linear } from '../../common/icons/customIcons/LinearIcon.js';
import { JiraIcon as Jira } from '../../common/icons/customIcons/JiraIcon.js';
import { MondayIcon as Monday } from '../../common/icons/customIcons/MondayIcon.js';
import { stripStyleProps } from '../../common/ui/styleProps.js';
import type { UIProps } from '../../common/ui/styleProps.js';
import { DownSolidIcon as DownSolid } from '../../common/icons/customIcons/DownSolidIcon.js';
import { UpSolidIcon as UpSolid } from '../../common/icons/customIcons/UpSolidIcon.js';
import { ClipboardIcon as Clipboard } from '../../common/icons/customIcons/ClipboardIcon.js';
import { LauncherIcon as Launcher } from '../../common/icons/customIcons/LauncherIcon.js';
import { FaceIcon as Face } from '../../common/icons/customIcons/FaceIcon.js';
import { WinkSmileyRectIcon as WinkSmileyRect } from '../../common/icons/customIcons/WinkSmileyRectIcon.js';
import { WinkSmileyCircleIcon as WinkSmileyCircle } from '../../common/icons/customIcons/WinkSmileyCircleIcon.js';
import { ReturnArrowIcon as ReturnArrow } from '../../common/icons/customIcons/ReturnArrow.js';
import { MailUnreadIcon as MailUnread } from '../../common/icons/customIcons/MailUnreadIcon.js';
import { UNTYPED_PHOSPHOR_ICONS } from './PhosphorIcons.js';

import classes from './Icon.css.js';

export const PHOSPHOR_ICONS = UNTYPED_PHOSPHOR_ICONS as {
  [key in keyof typeof UNTYPED_PHOSPHOR_ICONS]: PhosphorIcon;
};

// Icon names must be unique across PHOSPHOR_ICONS and CORD_ICONS - e.g. can't
// have an icon called 'Settings' in both
const CUSTOM_ICONS = {
  AddEmoji,
  AnnotationPin,
  Assign,
  ChatAdd,
  Cross,
  ArrowRight,
  ArrowUp,
  Clipboard,
  Cursor,
  DownSolid,
  Slack,
  SlackColour,
  Asana,
  Linear,
  Jira,
  Monday,
  UpSolid,
  Launcher,
  Face,
  Help,
  WinkSmileyCircle,
  WinkSmileyRect,
  ReturnArrow,
  MailUnread,
};

export const ALL_ICONS = { ...PHOSPHOR_ICONS, ...CUSTOM_ICONS };

export type IconType = keyof typeof ALL_ICONS;

type IconProps = UIProps<
  'svg',
  'marginPadding' | 'color',
  {
    name: IconType;
    size?: 'small' | 'large';
  }
>;

export function Icon({
  name,
  color = 'content-emphasis',
  size = 'small',
  className,
  ...otherProps
}: IconProps) {
  const { propsExStyleProps: elementProps } = stripStyleProps({
    color,
    ...otherProps,
  });

  const IconComponent = ALL_ICONS[name];

  const isPhosphorIcon = name in PHOSPHOR_ICONS;

  return (
    <IconComponent
      className={cx(
        classes.icon,
        size === 'large' ? classes.large : classes.medium,
        className,
      )}
      weight={isPhosphorIcon ? 'light' : undefined}
      {...elementProps}
    />
  );
}

export const newIcon = {
  NewComp: Icon,
  configKey: 'icon',
} as const;
