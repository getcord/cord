import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function ReturnArrowIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="-6 -5 26 18" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M.562.046c-.03.329-.022.658.024.988.249 1.812 1.358 3.156 3.208 3.884 1.369.539 3.109.734 5.186.583L7.128 7.936l1.397 1.061 3.706-4.874L7.345.413l-1.06 1.393L8.85 3.752c-1.798.129-3.306-.028-4.414-.464-1.26-.497-1.95-1.31-2.112-2.49a2.6 2.6 0 01.005-.739L.562.046z"
      />
    </CustomSvgIcon>
  );
}
