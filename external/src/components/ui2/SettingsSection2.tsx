import type { PropsWithChildren } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { Font } from 'common/ui/fonts.ts';

const useStyles = createUseStyles({
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    gap: cssVar('space-m'),
  },
  sectionContents: {
    gap: cssVar('space-2xs'),
  },
});

type SettingsSection2Props = {
  title: string;
  subtext?: string;
  subtextFontStyle?: Font;
  className?: string;
  forwardRef?: React.MutableRefObject<HTMLDivElement | null>;
};

export function SettingsSection2({
  title,
  subtext,
  subtextFontStyle = 'small',
  className,
  forwardRef,
  children,
}: PropsWithChildren<SettingsSection2Props>) {
  const classes = useStyles();
  return (
    <Box2
      forwardRef={forwardRef}
      className={cx(className, classes.section, classes.flexColumn)}
    >
      <Box2>
        <Text2 color="content-emphasis">{title}</Text2>
        {subtext && (
          <Text2 font={subtextFontStyle} color="content-secondary">
            {subtext}
          </Text2>
        )}
      </Box2>
      <Box2 className={cx(classes.sectionContents, classes.flexColumn)}>
        {children}
      </Box2>
    </Box2>
  );
}
