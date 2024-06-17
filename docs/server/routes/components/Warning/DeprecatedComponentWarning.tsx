/** @jsxImportSource @emotion/react */

import { Warning } from 'docs/server/routes/components/Warning/Warning.tsx';
import { H5 } from 'docs/server/ui/typography/Typography.tsx';

type DeprecatedComponentWarningProps = {
  componentName: string;
  children: React.ReactNode;
};

export function DeprecatedComponentWarning({
  componentName,
  children,
}: DeprecatedComponentWarningProps) {
  return (
    <Warning type="deprecated">
      <H5>
        Cord {componentName} has been deprecated and is no longer being actively
        developed.
      </H5>
      {children}
    </Warning>
  );
}
