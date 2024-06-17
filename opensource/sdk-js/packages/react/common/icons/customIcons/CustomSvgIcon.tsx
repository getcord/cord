import * as React from 'react';

export function CustomSvgIcon({
  children,
  ...otherProps
}: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...otherProps} xmlns="http://www.w3.org/2000/svg">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as any, {
              // eslint-disable-next-line i18next/no-literal-string
              vectorEffect: 'non-scaling-stroke',
            })
          : child,
      )}
    </svg>
  );
}
