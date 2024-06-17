import { SvgIcon } from 'external/src/components/ui/icons/SvgIcon.tsx';
import type { SvgIconProps } from 'external/src/components/ui/icons/util.ts';
import { useSvgIcon } from 'external/src/components/ui/icons/util.ts';

export function DownArrowIcon(props: SvgIconProps) {
  const { classes, svgIconProps } = useSvgIcon(props);
  return (
    <SvgIcon
      {...svgIconProps}
      viewBox="0 0 8 8"
      // Default size of 8px
      size={svgIconProps.size ?? 8}
    >
      <path
        d="M1 2H4L7 2.00007C7.40299 2.00004 7.62705 2.46619 7.37531 2.78087L4.39043 6.51196C4.19027 6.76216 3.80973 6.76216 3.60957 6.51196L0.624695 2.78087C0.372939 2.46617 0.596993 2 1 2Z"
        className={classes.fillPrimary}
      />
    </SvgIcon>
  );
}
