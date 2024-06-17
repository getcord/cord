/** @jsxImportSource @emotion/react */

import Footer from 'docs/server/ui/footer/Footer.tsx';
import Header from 'docs/server/ui/header/Header.tsx';
import { NavSidebar } from 'docs/server/ui/nav/Nav.tsx';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';
import AIChatBot from 'docs/server/routes/chatBot/AIChatBot.tsx';

type ShellProps = {
  children: React.ReactNode;
  showNav?: boolean;
  showFooter?: boolean;
  showAIChatbot?: boolean;
};

function Shell({
  children,
  showFooter = true,
  showNav = true,
  showAIChatbot = true,
}: ShellProps) {
  return (
    <div css={{ position: 'relative' }}>
      <Header />
      <div
        css={{
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '60px',
        }}
      >
        <div
          css={{
            display: 'flex',
            flexDirection: 'row',
            [breakpoints.tablet]: {
              flexDirection: 'column',
            },
          }}
        >
          {showNav && <NavSidebar />}
          {children}
        </div>
        {showFooter && <Footer />}
      </div>
      {showAIChatbot && <AIChatBot />}
    </div>
  );
}

export default Shell;
