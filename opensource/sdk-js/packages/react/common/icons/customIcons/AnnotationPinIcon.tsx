import * as React from 'react';
import { CustomSvgIcon } from '../customIcons/CustomSvgIcon.js';

// This svg is used as the pin icon e.g. in a button to start an annotation, not
// as the actual pin which goes on the page
export function AnnotationPinIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <CustomSvgIcon viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M4 10C4 6.68629 6.68629 4 10 4V4C13.3137 4 16 6.68629 16 10V10C16 13.3137 13.3137 16 10 16H4.36364C4.16281 16 4 15.8372 4 15.6364V10Z"
        fill="currentColor"
      />
    </CustomSvgIcon>
  );
}
