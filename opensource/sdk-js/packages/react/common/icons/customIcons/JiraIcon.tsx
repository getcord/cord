import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

export function JiraIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M15.732 4.583H9.714c0 1.5 1.214 2.715 2.714 2.715h1.107v1.071c0 1.5 1.215 2.714 2.715 2.714V5.101a.518.518 0 0 0-.518-.518ZM9.768 10.583H3.75c0 1.5 1.214 2.715 2.714 2.715h1.107v1.071c0 1.5 1.215 2.714 2.715 2.714v-5.982a.518.518 0 0 0-.518-.518Z"
        fill="#2684FF"
      />
      <path
        d="M12.75 7.583H6.732c0 1.5 1.214 2.715 2.714 2.715h1.107v1.071c0 1.5 1.215 2.714 2.715 2.714V8.101a.518.518 0 0 0-.518-.518Z"
        fill="#2684FF"
      />
    </CustomSvgIcon>
  );
}
