/** @jsxImportSource @emotion/react */

import { useCallback, useEffect, useState } from 'react';
import SimpleCard, {
  SimpleCardTitle,
} from 'docs/server/ui/card/SimpleCard.tsx';

type ExpandoCardProps = {
  id: string;
  title: string;
  children: React.ReactNode;
};

function ExpandoCard({ id, title, children }: ExpandoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  useEffect(() => {
    if (window.location.hash === '#' + id) {
      setExpanded(true);
    }
  }, [id]);

  return (
    <SimpleCard>
      <SimpleCardTitle>
        <a
          onClick={toggle}
          href={'#' + id}
          id={id}
          css={{
            display: 'block',
            scrollMarginTop: '90px',
            '&&': {
              textDecoration: 'none',
            },
          }}
        >
          <span css={{ paddingRight: 8 }}>
            {expanded ? <>&#9660;</> : <>&#9654;</>}
          </span>{' '}
          {title}
        </a>
      </SimpleCardTitle>
      <div
        css={{
          overflow: expanded ? 'auto' : 'hidden',
          height: expanded ? 'auto' : 0,
        }}
      >
        {children}
      </div>
    </SimpleCard>
  );
}

export default ExpandoCard;
