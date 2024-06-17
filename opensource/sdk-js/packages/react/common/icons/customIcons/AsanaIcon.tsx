import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function AsanaIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 20 20" {...props}>
      <circle cx={10} cy={6} r={3} fill="#F95870" />
      <circle cx={6} cy={13} r={3} fill="#F95870" />
      <circle cx={14} cy={13} r={3} fill="#F95870" />
    </CustomSvgIcon>
  );
}
