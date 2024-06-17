import cx from 'classnames';
import React from 'react';

import { createUseStyles } from 'react-jss';
import { Typography } from '@mui/material';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';

const useStyles = createUseStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: '80px 2fr 1fr',
    gap: `${Sizes.XLARGE}px`,
    padding: '40px',
    paddingLeft: '0',
  },
  boxEnd: {
    justifySelf: 'end',
    alignSelf: 'center',
  },
  successCheck: {
    color: Colors.GREY_LIGHT,
    paddingLeft: `${Sizes.XLARGE}px`,
    alignSelf: 'start',
  },
  taskCompleted: {
    color: Colors.GREEN,
  },
});

export function TaskCard({
  header,
  body,
  footer,
  CTA,
  taskCompleted,
}: {
  header: string;
  body: string | React.ReactNode;
  footer?: React.ReactNode;
  CTA?: React.ReactNode;
  taskCompleted?: boolean;
}) {
  const classes = useStyles();
  return (
    <Box className={classes.container}>
      <CheckCircleIcon
        height={80}
        width={80}
        className={cx(classes.successCheck, {
          [classes.taskCompleted]: taskCompleted,
        })}
      />
      <section>
        <Typography variant="h3" sx={{ mb: 1 }}>
          {header}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: Colors.GREY_DARK }}>
          {body}
        </Typography>
        {footer}
      </section>

      <section className={cx(classes.boxEnd)}>{CTA}</section>
    </Box>
  );
}
