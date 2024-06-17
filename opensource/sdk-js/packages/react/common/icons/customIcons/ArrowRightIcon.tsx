import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function ArrowRightIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 8L13.5 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 3.5L13.5 8L9 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CustomSvgIcon>
  );
}
