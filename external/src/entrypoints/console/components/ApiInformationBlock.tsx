import cx from 'classnames';
import { Card } from 'react-bootstrap';
import { createUseStyles } from 'react-jss';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { Colors } from 'common/const/Colors.ts';

const useStyles = createUseStyles({
  body: {
    backgroundColor: Colors.GREY_X_LIGHT,
    flexGrow: 0,
    marginBottom: '12px',
    width: '100%',
  },
  text: {
    margin: '-2px',
  },
});

export function ApiInformationBlock({
  cliCommand,
  url,
  docsLink,
  className,
}: {
  cliCommand: string | null;
  url: string | undefined | null;
  docsLink: string;
  className?: string;
}) {
  const classes = useStyles();
  return (
    <Card.Body className={cx(classes.body, className)}>
      <Card.Text className={classes.text}>
        CLI command: <code>{cliCommand}</code>
      </Card.Text>
      <Card.Text className={classes.text}>
        API Endpoint : <code>{url}</code>
      </Card.Text>
      <Card.Text className={classes.text}>
        For more information, please refer to the{' '}
        <a href={`${DOCS_ORIGIN}${docsLink}`} target="_blank" rel="noreferrer">
          API docs
        </a>
        .
      </Card.Text>
    </Card.Body>
  );
}
