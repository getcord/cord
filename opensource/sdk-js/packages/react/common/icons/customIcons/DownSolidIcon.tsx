import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function DownSolidIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox=" 0 0 16 16" fill="none" {...props}>
      <path
        d="m3.983 6.767 3.75 3.75a.38.38 0 0 0 .534 0l3.75-3.75a.394.394 0 0 0 .08-.412.375.375 0 0 0-.347-.23h-7.5a.375.375 0 0 0-.347.23.394.394 0 0 0 .08.412Z"
        fill="currentColor"
      />
    </CustomSvgIcon>
  );
}
