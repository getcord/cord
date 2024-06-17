import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import type { UIProps } from '@cord-sdk/react/common/ui/styleProps.ts';

type ContentBox2Props = UIProps<
  'div',
  'borderRadius' | 'marginPadding',
  {
    type?: 'default' | 'raised' | 'large';
    className?: string;
  }
>;

export function ContentBox2({
  type = 'default',
  children,
  borderRadius,
  className,
  ...otherProps
}: ContentBox2Props) {
  return (
    <Box2
      backgroundColor="base"
      borderColor={type === 'large' ? undefined : 'base-x-strong'}
      borderRadius={borderRadius ?? 'medium'}
      padding="2xs"
      shadow={
        type === 'default' ? undefined : type === 'raised' ? 'small' : 'large'
      }
      className={className}
      {...otherProps}
    >
      {children}
    </Box2>
  );
}
