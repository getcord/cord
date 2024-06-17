import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function AddEmojiIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M11 3h3.5M12.75 4.75v-3.5M7.641 2.334a6 6 0 1 0 5.96 5.976"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.217 7.833a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM9.683 7.833a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        fill="currentColor"
      />
      <path
        d="M10.13 9.833a3.002 3.002 0 0 1-5.197 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CustomSvgIcon>
  );
}
