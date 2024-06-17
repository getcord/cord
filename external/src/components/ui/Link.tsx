import cx from 'classnames';
import { createUseStyles } from 'react-jss';
import type { Color } from 'common/const/Colors.ts';

type StyleProps = {
  color: Color;
  colorHover: Color;
};

const useStyles = createUseStyles({
  link: ({ color, colorHover }: StyleProps) => ({
    color,
    '&:hover': {
      color: colorHover,
    },
  }),
  linkNoUnderline: {
    textDecoration: 'none',
  },
  linkUnderline: {
    textDecoration: 'underline',
  },
  linkUnderlineHover: {
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});

type Props = {
  newTab?: boolean;
  underline?: 'hover' | 'always' | 'none';
  color?: Color;
  colorHover?: Color;
} & React.HTMLProps<HTMLAnchorElement>;

export const Link = (props: React.PropsWithChildren<Props>) => {
  const {
    underline = 'always',
    className,
    newTab,
    color = 'INHERIT',
    colorHover,
    ...propsToPassDirectly
  } = props;

  const classes = useStyles({
    color,
    colorHover: colorHover ?? color,
  });

  return (
    <a
      className={cx(
        classes.link,
        {
          [classes.linkNoUnderline]: underline !== 'always',
          [classes.linkUnderline]: underline === 'always',
          [classes.linkUnderlineHover]: underline !== 'none',
        },
        className,
      )}
      target={props.newTab ? '_blank' : '_top'}
      // eslint-disable-next-line i18next/no-literal-string
      {...(newTab && { rel: 'noReferrer ' })}
      {...propsToPassDirectly}
    >
      {props.children}
    </a>
  );
};
