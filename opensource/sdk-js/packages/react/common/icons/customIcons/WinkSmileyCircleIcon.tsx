import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function WinkSmileyCircleIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 20 20" fill="none" {...props}>
      <rect width="20" height="20" rx="10" fill="black" />
      <path
        d="M10.4167 7.56183L8.33334 11.4386H11.721"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="bevel"
      />
      <path
        d="M5 10.7927C5.18634 12.2833 6.39752 15.2647 9.75155 15.2647C13.1056 15.2647 14.5031 12.2833 14.7826 10.7927"
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M11.7391 6.60011L15 5.73055"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="6.12231" cy="6.31525" r="1.12231" fill="white" />
    </CustomSvgIcon>
  );
}
