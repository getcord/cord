import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Button } from 'react-bootstrap';

import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

const useStyles = createUseStyles({
  copyButton: {
    marginLeft: '4px',
    padding: '2px',
  },
  copyTickIcon: {
    color: '#3cc23c',
  },
});

export function CopyButton({ value }: { value: unknown }) {
  const classes = useStyles();
  const [clicked, setClicked] = useState(false);

  return (
    <Button
      className={cx('shadow-none', classes.copyButton)}
      onClick={() => {
        if (!clicked) {
          void navigator.clipboard.writeText(String(value));
        }
        setClicked(true);
      }}
      variant="light"
      onMouseLeave={() => setTimeout(() => setClicked(false), 1500)}
    >
      <Icon
        className={cx({ [classes.copyTickIcon]: clicked })}
        name={clicked ? 'Check' : 'Copy'}
        size="small"
      />
    </Button>
  );
}
