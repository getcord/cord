/** @jsxImportSource @emotion/react */

import { HelpIcon } from 'docs/server/routes/getStarted/liveCSSEditor/HelpIcon.tsx';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
  },
} as const;
type Props = React.PropsWithChildren<{
  cssVariableName: string;
  shortName: string;
  description: string;
}>;
export function CSSVariableLayout({
  cssVariableName,
  shortName,
  description,
  children,
}: Props) {
  return (
    <div css={styles.container}>
      <div
        css={{ display: 'flex', alignItems: 'center', position: 'relative' }}
      >
        <div css={{ fontWeight: 'bold', marginRight: '4px' }}>{shortName}</div>
        <HelpIcon label={`--cord-${cssVariableName}`} />
      </div>
      {children}
      <div>{description}</div>
    </div>
  );
}
