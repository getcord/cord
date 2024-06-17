import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function AssignIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M9.5 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeMiterlimit={10}
      />
      <path
        d="M5 15c.422-.602 1.066-1.107 1.86-1.46A6.547 6.547 0 0 1 9.5 13c.932 0 1.845.187 2.64.54.794.353 1.438.858 1.86 1.46M18.75 2l-4 4-2-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.907 8.323a7.5 7.5 0 1 1-10.81-5.507C7.51 2.098 8.5 2 10 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CustomSvgIcon>
  );
}
