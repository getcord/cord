/* eslint-disable i18next/no-literal-string */
import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import dayjs from 'dayjs';
import { Typography } from '@mui/material';
import type { JsonValue } from 'common/types/index.ts';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

type RenderValueProps = {
  value: JsonValue | undefined;
  isTimestamp?: boolean;
  forceJSONExpanded?: boolean;
};

const useStyles = createUseStyles({
  displayOnTwoLines: {
    display: 'flex',
    flexDirection: 'column',
  },
  buttonLink: {
    color: Colors.BRAND_PURPLE_DARK,
    border: 'none',
    background: 'transparent',
    padding: 0,
    '&:focus': {
      outline: 'none',
    },
  },
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

function TwoLineDisplay(first: string, second: string) {
  const classes = useStyles();
  return (
    <div className={classes.displayOnTwoLines}>
      <Typography
        variant="body2"
        sx={{ lineHeight: '20px', color: Colors.BRAND_PRIMARY }}
      >
        {first}
      </Typography>
      <Typography variant="monospaceTableCell" sx={{ lineHeight: '20px' }}>
        {second}
      </Typography>
    </div>
  );
}

export function RenderValue({
  value,
  isTimestamp,
  forceJSONExpanded,
}: RenderValueProps): JSX.Element {
  const classes = useStyles();
  const [payloadVisible, setPayloadVisible] = useState(forceJSONExpanded);

  if (value === null || value === undefined) {
    return TwoLineDisplay('—', String(value));
  }
  if (typeof value === 'string') {
    if (isTimestamp) {
      const timestampDay = dayjs(value);
      const nowDay = dayjs();

      let formattedTimestamp = '';
      if (timestampDay.year() === nowDay.year()) {
        formattedTimestamp = timestampDay.format('DD MMM hh:mm:ss');
      } else {
        formattedTimestamp = timestampDay.format('DD MMM YYYY hh:mm:ss');
      }
      return TwoLineDisplay(formattedTimestamp, value);
    }
    return <>{value}</>;
  }
  if (typeof value === 'number') {
    return <>{value.toString()}</>;
  }
  if (typeof value === 'boolean') {
    return <>{value.toString()}</>;
  }

  return (
    <div className={classes.codeblockContainer}>
      {!forceJSONExpanded && (
        <button
          onClick={() => setPayloadVisible(!payloadVisible)}
          type="button"
          className={classes.buttonLink}
        >
          {payloadVisible ? 'Hide' : 'Show'}
        </button>
      )}

      {payloadVisible && (
        <pre className={classes.codeBlock}>
          <code>{JSON.stringify(value, null, '  ')}</code>
        </pre>
      )}
    </div>
  );
}
