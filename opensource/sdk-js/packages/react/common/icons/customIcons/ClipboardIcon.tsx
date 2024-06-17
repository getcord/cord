import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function ClipboardIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M12.5 3.125h3.125c.166 0 .325.064.442.178a.6.6 0 0 1 .183.43v12.783a.6.6 0 0 1-.183.43.633.633 0 0 1-.442.179H4.375a.633.633 0 0 1-.442-.178.6.6 0 0 1-.183-.43V3.733a.6.6 0 0 1 .183-.43.634.634 0 0 1 .442-.179H7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.875 5.625V5a3.125 3.125 0 0 1 6.25 0v.625h-6.25ZM12.5 9.5l-3.333 3L7.5 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CustomSvgIcon>
  );
}
