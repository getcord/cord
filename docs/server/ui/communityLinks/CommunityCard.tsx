import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

export function CommunityCard() {
  const location = useLocation();

  const category = useMemo(() => {
    const params = location.pathname.split('/').filter((val) => val !== '');
    if (params.length === 0) {
      return null;
    }
    const type = params[0];

    switch (type) {
      case 'components':
        return 'components';
      case 'customization':
        return 'customization';
      case 'js-apis-and-hooks':
      case 'rest-apis':
        return 'api';
      default:
        return null;
    }
  }, [location.pathname]);
  return (
    <EmphasisCard>
      <p>
        Not finding the answer you need? Ask our{' '}
        <a
          href={
            category
              ? `https://community.cord.com/category/${category}`
              : 'https://community.cord.com'
          }
        >
          <strong>Developer Community</strong>
        </a>
      </p>
    </EmphasisCard>
  );
}
