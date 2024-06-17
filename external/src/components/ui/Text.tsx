import { useMemo } from 'react';
import cx from 'classnames';
import { createUseStyles } from 'react-jss';
import type { Color } from 'common/const/Colors.ts';
import { Colors } from 'common/const/Colors.ts';
import type { FontSize } from 'common/const/Sizes.ts';
import { FontSizes, LineHeights } from 'common/const/Sizes.ts';
import type { SpacingSize } from 'common/const/Spacing.ts';
import { spacingToCssString } from 'common/const/Spacing.ts';

type HtmlTag = 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'label';

type StyleProps = {
  color: Color;
  fontSize: FontSize;
  overflow: 'ellipsis' | 'default';
  margin?: SpacingSize;
  padding?: SpacingSize;
  center?: boolean;
};

type ElementType<T extends HtmlTag> = T extends 'p'
  ? HTMLParagraphElement
  : T extends 'span'
  ? HTMLSpanElement
  : T extends 'label'
  ? HTMLLabelElement
  : HTMLHeadingElement;

type TextProps<T extends HtmlTag = 'p'> = {
  tag?: T;
  forwardRef?: React.RefObject<ElementType<T>>;
} & Partial<StyleProps> &
  Omit<React.HTMLProps<ElementType<T>>, 'ref'>;

const useTextStyles = createUseStyles({
  text: (props: StyleProps) => ({
    color: Colors[props.color],
    fontSize: FontSizes[props.fontSize],
    lineHeight: LineHeights[props.fontSize],
    ...(props.margin && {
      margin: spacingToCssString(props.margin),
    }),
    ...(props.padding && {
      padding: spacingToCssString(props.padding),
    }),
  }),
  textCenter: { textAlign: 'center' },
  textEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export const Text = <T extends HtmlTag = 'p'>(
  props: React.PropsWithChildren<TextProps<T>>,
) => {
  const {
    color = 'GREY_X_DARK',
    fontSize = 'default',
    overflow = 'default',
    tag = 'p',
    center = false,
    margin,
    padding,
    className,
    forwardRef: ref,
    ...propsToPassDirectly
  } = props;

  const styleProps = useMemo<StyleProps>(
    () => ({
      color,
      fontSize,
      overflow,
      margin,
      padding,
      center,
    }),
    [color, fontSize, overflow, margin, padding, center],
  );

  const classes = useTextStyles(styleProps);

  const HtmlTag = tag;

  return (
    <HtmlTag
      // Typescript can't infer that the props are typed correctly for the tag
      // via our generic handling above. Props are typed as HTMLProps<Tag> with
      // a default tag of 'p' if not provided
      {...(propsToPassDirectly as any)}
      ref={ref}
      className={cx(
        classes.text,
        {
          [classes.textEllipsis]: styleProps.overflow === 'ellipsis',
          [classes.textCenter]: styleProps.center,
        },
        className,
      )}
    >
      {props.children}
    </HtmlTag>
  );
};
