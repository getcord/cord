import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function LauncherIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 40 40" fill="none" {...props}>
      <path
        d="M23.386 31.276s-2.203 4.892-2.314 5.086a1.28 1.28 0 0 1-.456.468 1.203 1.203 0 0 1-1.232 0 1.281 1.281 0 0 1-.456-.468l-2.314-5.086a1.28 1.28 0 0 0-.456-.467c-.188-.112-.4-.17-.616-.17H7.25a1.22 1.22 0 0 1-.884-.385A1.348 1.348 0 0 1 6 29.325V8.313c0-.348.132-.682.366-.928A1.22 1.22 0 0 1 7.25 7h25.5c.331 0 .65.138.884.385.234.246.366.58.366.928v21.012c0 .349-.132.683-.366.929a1.22 1.22 0 0 1-.884.385h-8.292c-.216 0-.428.058-.616.17a1.281 1.281 0 0 0-.456.467ZM15 19h10M20 14v10"
        strokeWidth={1.5}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </CustomSvgIcon>
  );
}
