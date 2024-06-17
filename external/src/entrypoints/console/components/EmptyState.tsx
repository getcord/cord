import { createUseStyles } from 'react-jss';
import { Box, Link, Typography } from '@mui/material';

import EmptyMessagesSVG from 'external/src/static/empty-messages.svg';
import EmptyThreadsSVG from 'external/src/static/empty-threads.svg';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';

const useStyles = createUseStyles({
  emptyStateSvg: {
    maxWidth: '192px',
    color: Colors.BRAND_PURPLE_DARK,
    marginBlockEnd: Sizes.LARGE,
  },
  emptyStateBox: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
    border: `1px solid ${Colors.GREY_LIGHT}`,
  },
  emptyStateContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: Sizes.MEDIUM,
    margin: `${Sizes.XXLARGE}px 0`,
  },
  emptyStateTextCode: {
    padding: Sizes.XLARGE,
    margin: `${Sizes.MEDIUM}px 0`,
    backgroundColor: Colors.GREY_X_LIGHT,
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
  },
});

export function EmptyState({
  path,
  location,
  threadID = 'xyz456',
  isFilteredData = false,
}: {
  path: 'threads' | 'messages';
  location?: string;
  threadID?: string;
  isFilteredData?: boolean;
}) {
  const classes = useStyles();

  return (
    <Box className={classes.emptyStateBox}>
      <section className={classes.emptyStateContainer}>
        {path === 'messages' && (
          <>
            <EmptyMessagesSVG className={classes.emptyStateSvg} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              There are 0 messages {location ? `in ${location}` : undefined}
            </Typography>
            <Typography variant="body2">
              Run the following command to generate a sample message or check
              out the{' '}
              <Link
                href={`${DOCS_ORIGIN}/rest-apis/messages/`}
                target="_blank"
                rel="noreferrer"
              >
                API docs
              </Link>{' '}
              for more information
            </Typography>
            <pre className={classes.emptyStateTextCode}>
              <code>
                <Typography variant="monospaceCode">
                  {`$ curl "https://api.cord.com/v1/threads/${threadID}/messages"
  -X POST 
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
  --json ${JSON.stringify(
    {
      id: 'abc123',
      authorID: 'user123',
      content: [
        {
          type: 'p',
          children: [
            {
              text: 'Can you take a look at this?',
            },
          ],
        },
      ],
    },
    null,
    ' ',
  )}`}
                </Typography>
              </code>
            </pre>
          </>
        )}
        {path === 'threads' && (
          <>
            <EmptyThreadsSVG className={classes.emptyStateSvg} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              There are 0 threads in {location}{' '}
              {isFilteredData ? 'matching the filters provided' : undefined}
            </Typography>
            <Typography variant="body2">
              Run the following command to generate a sample thread with a
              message or check out the{' '}
              <Link
                href={`${DOCS_ORIGIN}/rest-apis/threads/`}
                target="_blank"
                rel="noreferrer"
              >
                API docs
              </Link>{' '}
              for more information
            </Typography>
            <pre className={classes.emptyStateTextCode}>
              <code>
                <Typography variant="monospaceCode">
                  {`$ curl "https://api.cord.com/v1/threads/${threadID}/messages"
  -X POST 
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
  --json ${JSON.stringify(
    {
      id: 'abc123',
      authorID: 'user123',
      content: [
        {
          type: 'p',
          children: [
            {
              text: 'Can you take a look at this?',
            },
          ],
        },
      ],
    },
    null,
    ' ',
  )}`}
                </Typography>
              </code>
            </pre>
          </>
        )}
      </section>
    </Box>
  );
}
