/** @jsxImportSource @emotion/react */

import { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import StickyBox from 'react-sticky-box';

// eslint-disable-next-line @cspell/spellchecker -- supposed to auto-ignore imports, looks like a bug.
import AutomagicTableOfContents from 'docs/server/ui/tableOfContents/AutomagicTableOfContents.tsx';
import Heading from 'docs/server/ui/typography/Heading.tsx';
import PageSubtitle from 'docs/server/ui/typography/PageSubtitle.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';
import { generateBreadcrumbList } from 'docs/lib/structuredData/structuredData.ts';
import { CommunityHeaderLink } from 'docs/server/ui/communityLinks/CommunityHeaderLink.tsx';
import { CommunityCard } from 'docs/server/ui/communityLinks/CommunityCard.tsx';

type PageProps = {
  title: string;
  pretitle?: string;
  pretitleLinkTo?: string;
  /**
   * This is also used as our meta tag og:description
   */
  pageSubtitle: string | { metaDescription: string; element: React.ReactNode };
  children?: React.ReactNode;
  showTableOfContents?: boolean;
  showCommunityLinkCard?: boolean;
  fullWidth?: boolean;
};

function Page({
  title,
  pretitle,
  pretitleLinkTo,
  pageSubtitle,
  children,
  showTableOfContents,
  showCommunityLinkCard = true,
  fullWidth = false,
}: PageProps) {
  const location = useLocation();

  const jsonLDContent = useMemo(() => {
    const content = generateBreadcrumbList(location.pathname);
    if (content) {
      return (
        <script type="application/ld+json" id="ld-json">
          {JSON.stringify(content)}
        </script>
      );
    } else {
      return null;
    }
  }, [location.pathname]);

  return (
    <div
      css={{
        maxWidth: fullWidth ? 'none' : '1200px',
        width: fullWidth ? '100%' : 'auto',
        [breakpoints.desktop]: {
          marginRight: 0,
        },
        padding: '40px',
        [breakpoints.tablet]: {
          padding: '16px',
        },
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 48,
      }}
    >
      <div>
        {title && (
          <>
            <Helmet>
              <title>{title} | Cord SDK</title>
              <meta
                property="og:description"
                content={
                  typeof pageSubtitle === 'string'
                    ? pageSubtitle
                    : pageSubtitle.metaDescription
                }
              />
              {jsonLDContent}
            </Helmet>
            <div
              css={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                alignItems: 'flex-start',
              }}
            >
              <Heading
                title={title}
                pretitle={pretitle}
                pretitleLinkTo={pretitleLinkTo}
              />
              <CommunityHeaderLink />
            </div>
          </>
        )}
        <PageSubtitle>
          {typeof pageSubtitle === 'string'
            ? pageSubtitle
            : pageSubtitle.element}
        </PageSubtitle>
        <HR />
        <div id="page-content" css={{ maxWidth: fullWidth ? 'auto' : 900 }}>
          {children}
          {showCommunityLinkCard && (
            <>
              <HR />
              <CommunityCard />
            </>
          )}
        </div>
      </div>
      {showTableOfContents && (
        <StickyBox offsetBottom={60} offsetTop={60}>
          <AutomagicTableOfContents />
        </StickyBox>
      )}
    </div>
  );
}

export default Page;
