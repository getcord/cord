import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function UpSolidIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox=" 0 0 16 16" fill="none" {...props}>
      <path
        d="m12.017 10.233-3.75-3.75a.38.38 0 0 0-.534 0l-3.75 3.75a.394.394 0 0 0-.08.412.375.375 0 0 0 .347.23h7.5a.375.375 0 0 0 .347-.23.394.394 0 0 0-.08-.412Z"
        fill="currentColor"
      />
    </CustomSvgIcon>
  );
}
