import { Button, TableCell, Typography } from '@mui/material';
import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  codeBlock: {
    display: 'flex',
    alignItems: 'center',
    padding: Sizes.XLARGE,
    width: 'min-content',
    margin: `${Sizes.MEDIUM}px 0`,
    backgroundColor: Colors.GREY_X_LIGHT,
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
    color: Colors.CONTENT_PRIMARY,
    height: '100%',
  },
  codeblockContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

export function JSONCell({ json }: { json: object }) {
  const classes = useStyles();
  const [payloadVisible, setPayloadVisible] = useState(false);

  if (Object.keys(json).length === 0) {
    return (
      <TableCell sx={{ textWrap: 'nowrap' }}>
        <Typography variant="monospaceTableCell">-</Typography>
      </TableCell>
    );
  }

  return (
    <TableCell sx={{ textWrap: 'nowrap' }}>
      <div className={classes.codeblockContainer}>
        {
          <Button
            variant="text"
            onClick={() => {
              setPayloadVisible(!payloadVisible);
            }}
          >
            {payloadVisible ? 'Hide' : 'Show'}
          </Button>
        }
        {payloadVisible && (
          <pre className={classes.codeBlock}>
            <code>{JSON.stringify(json, null, '  ')}</code>
          </pre>
        )}
      </div>
    </TableCell>
  );
}
