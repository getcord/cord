import { SvgIcon } from 'external/src/components/ui/icons/SvgIcon.tsx';
import type { SvgIconProps } from 'external/src/components/ui/icons/util.ts';
import { useSvgIcon } from 'external/src/components/ui/icons/util.ts';

export function ClipboardTaskIcon(props: SvgIconProps) {
  const { classes, svgIconProps } = useSvgIcon(props);
  return (
    <SvgIcon {...svgIconProps}>
      <path
        d="M15 3.75h3.75a.75.75 0 01.75.75v15.75a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V4.5a.75.75 0 01.75-.75H9"
        className={classes.strokePrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 11.796l-3.833 3.659-1.917-1.83"
        className={classes.strokePrimary}
        strokeLinecap="square"
      />
      <path
        d="M8.25 6.75V6a3.75 3.75 0 017.5 0v.75h-7.5z"
        className={classes.strokePrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
