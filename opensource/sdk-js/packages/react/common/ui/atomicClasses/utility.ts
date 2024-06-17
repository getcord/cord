export type UtilityProps = {
  scrollable?: true;
  row?: true;
  ellipsis?: true;
  center?: true;
  insetZero?: true;
  noWrap?: true;
};

export const getUtilityStyles = ({
  scrollable,
  row,
  ellipsis,
  center,
  insetZero,
  noWrap,
}: UtilityProps) => ({
  ...(scrollable && {
    overflow: 'auto',
  }),

  ...(row && {
    display: 'flex',
    alignItems: 'center',
  }),

  ...(ellipsis && {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),

  ...(center && {
    textAlign: 'center',
  }),

  ...(insetZero && {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }),

  ...(noWrap && {
    whiteSpace: 'nowrap',
  }),
});
