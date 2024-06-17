import { useCallback, useRef, useState } from 'react';
import { ArrowUpCircleIcon } from '@heroicons/react/20/solid';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { H4 } from 'docs/server/ui/typography/Typography.tsx';

const useStyles = createUseStyles({
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  answerContainer: {
    marginBottom: 12,
  },
  arrow: {
    transform: 'rotate(-180deg)',
    transition: 'transform 0.2s',
    userSelect: 'none',
  },
  open: {
    '& $arrow': {
      transform: 'rotate(0deg)',
    },
  },
});

type FAQQuestionProps = {
  title: string;
  children: React.ReactNode;
  expandedByDefault?: boolean;
};

export function FAQQuestion(props: FAQQuestionProps) {
  const { title, children, expandedByDefault } = props;

  const styles = useStyles();

  const [collapsed, setCollapsed] = useState(!expandedByDefault);
  const answerRef = useRef<HTMLDivElement>(null);
  const blockContentRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if ('href' in e.target && !collapsed) {
        return;
      }
      const nextState = !collapsed;
      setCollapsed(nextState);
    },
    [collapsed, setCollapsed],
  );

  return (
    <div>
      <div
        onClick={toggle}
        className={cx({
          [styles.titleContainer]: true,
          [styles.open]: !collapsed,
        })}
      >
        <H4 style={{ cursor: 'pointer' }}>{title}</H4>
        <ArrowUpCircleIcon width={24} className={styles.arrow} />
      </div>
      {collapsed ? null : (
        <div ref={answerRef} className={styles.answerContainer}>
          <div ref={blockContentRef}>{children}</div>
        </div>
      )}
    </div>
  );
}
