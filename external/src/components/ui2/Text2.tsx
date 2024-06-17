import { useMemo } from 'react';

import { useStyleProps } from 'external/src/components/ui2/useStyleProps.ts';
import type { UIProps } from '@cord-sdk/react/common/ui/styleProps.ts';

type ValidTag = 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'label' | 'a';

export type Text2Props<Tag extends ValidTag> = UIProps<
  Tag,
  'center' | 'color' | 'font' | 'marginPadding' | 'ellipsis' | 'noWrap',
  { as?: Tag }
>;

/**
 * @deprecated use `p` instead
 */
export const Text2 = <T extends ValidTag = 'p'>(
  props: React.PropsWithChildren<Text2Props<T>>,
) => {
  const propsWithDefaults = useMemo(
    () => ({
      ...props,
      font: props.font ?? 'body',
      color: props.color ?? 'content-primary',
      as: props.as ?? 'p',
    }),
    [props],
  );

  const { children, as, ...otherProps } = useStyleProps(propsWithDefaults);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- this is actually necessary???
  const HtmlTag = as as ValidTag; // Initialised with default above

  return (
    <HtmlTag
      // Typescript can't infer that the props are typed correctly for the tag
      // via our generic handling above. Props are typed as HTMLProps<Tag> with
      // a default tag of 'p' if not provided
      {...(otherProps as any)}
    >
      {children}
    </HtmlTag>
  );
};
