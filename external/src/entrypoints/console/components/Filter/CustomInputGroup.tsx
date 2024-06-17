import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  wrapper: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: {
    fontSize: '12px',
    color: Colors.CONTENT_PRIMARY,
    fontWeight: 500,
    marginBottom: '0',
  },
  input: {
    border: `1px solid ${Colors.GREY_LIGHT}`,
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
    padding: `${Sizes.MEDIUM}px ${Sizes.DEFAULT_PADDING_PX}px`,
    color: Colors.CONTENT_PRIMARY,
    '&::placeholder': {
      color: Colors.CONTENT_SECONDARY,
    },
    '&:focus': {
      outline: 'none',
      border: `1px solid ${Colors.CONTENT_PRIMARY}`,
    },
  },
});

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function CustomInputGroup({ label, className, ...inputProps }: Props) {
  const classes = useStyles();

  return (
    <div className={classes.wrapper}>
      <label className={classes.label} htmlFor={inputProps.id}>
        {label}
      </label>
      <input
        className={cx(classes.input, className)}
        type="text"
        {...inputProps}
      />
    </div>
  );
}
