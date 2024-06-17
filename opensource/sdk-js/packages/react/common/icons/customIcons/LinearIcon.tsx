import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function LinearIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 20 20" fill="none" {...props}>
      <g clipPath="url(#a)" fill="#5E6AD2">
        <path d="M14.57 15.312A7.007 7.007 0 1 0 4.688 5.43l9.884 9.883ZM13.736 15.932 4.068 6.264a6.953 6.953 0 0 0-.504.95l9.221 9.222a6.97 6.97 0 0 0 .951-.504ZM11.7 16.804 3.195 8.301A7.03 7.03 0 0 0 3 9.56L10.44 17a7.02 7.02 0 0 0 1.26-.196ZM8.917 16.932l-5.849-5.85a6.976 6.976 0 0 0 1.97 3.88 6.977 6.977 0 0 0 3.88 1.97Z" />
      </g>
      <defs>
        <clipPath id="a">
          <path fill="#fff" transform="translate(3 3)" d="M0 0h14v14H0z" />
        </clipPath>
      </defs>
    </CustomSvgIcon>
  );
}
