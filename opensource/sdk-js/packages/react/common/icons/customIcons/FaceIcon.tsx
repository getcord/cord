import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function FaceIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox=" 0 0 16 16" fill="none" {...props}>
      <circle
        cx="8.00014"
        cy="8.00014"
        r="7.50014"
        fill="white"
        stroke="white"
      />
      <circle cx="11" cy="5" r="1" fill="#121314" />
      <circle cx="5" cy="5" r="1" fill="#121314" />
      <path
        d="M7.79248 14.0196C9.36395 14.0196 10.4887 13.3139 11.2393 12.4436C11.9783 11.5869 12.3614 10.5666 12.4918 9.87144L11.5089 9.68715C11.4055 10.2388 11.0874 11.0887 10.4821 11.7904C9.88854 12.4786 9.02626 13.0196 7.79248 13.0196V14.0196Z"
        fill="#121314"
      />
      <path d="M9 7L6 10H9" stroke="#121314" strokeLinejoin="round" />
    </CustomSvgIcon>
  );
}
