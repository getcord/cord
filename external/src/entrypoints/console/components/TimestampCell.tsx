import { TableCell, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  timestampCell: {
    display: 'flex',
    flexDirection: 'column',
  },
});

export function TimestampCell({ time }: { time: string }) {
  const classes = useStyles();
  const timestampDay = dayjs(time);
  const nowDay = dayjs();

  let formattedTimestamp = '';
  if (time === null) {
    formattedTimestamp = '-';
  } else if (timestampDay.year() === nowDay.year()) {
    formattedTimestamp = timestampDay.format('DD MMM hh:mm:ss');
  } else {
    formattedTimestamp = timestampDay.format('DD MMM YYYY hh:mm:ss');
  }

  return (
    <TableCell sx={{ textWrap: 'nowrap' }}>
      <div className={classes.timestampCell}>
        <Typography variant="body2" sx={{ lineHeight: '20px' }}>
          {formattedTimestamp}
        </Typography>
        <Typography variant="monospaceTableCell" sx={{ lineHeight: '20px' }}>
          {time ?? 'null'}
        </Typography>
      </div>
    </TableCell>
  );
}
