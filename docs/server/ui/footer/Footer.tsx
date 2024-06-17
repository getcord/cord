/** @jsxImportSource @emotion/react */

import FooterLink from 'docs/server/ui/footer/FooterLink.tsx';
import FooterList from 'docs/server/ui/footer/FooterList.tsx';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';

const Footer = () => {
  return (
    <footer
      css={{
        background: 'var(--color-greyXdark)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'row',
        [breakpoints.tablet]: {
          flexDirection: 'column-reverse',
        },
        gap: 24,
        padding: '140px 16px 16px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        css={{
          alignItems: 'start',
          display: 'flex',
          flex: 1,
        }}
      >
        <img
          src="/static/images/cord-footer-logo.svg"
          // eslint-disable-next-line @cspell/spellchecker
          alt="Cord's company wordmark and swirly woop"
        />
      </div>
      <div
        css={{
          display: 'flex',
          flex: 2,
          flexDirection: 'row',
          [breakpoints.tablet]: {
            flexDirection: 'column',
          },
          justifyContent: 'space-around',
        }}
      >
        <FooterList title="Company">
          <FooterLink href="https://cord.com/about">About</FooterLink>
          <FooterLink href="https://cord.com/blog">Blog</FooterLink>
          <FooterLink href="https://cord.com/jobs">Jobs</FooterLink>
        </FooterList>
        <FooterList title="Product">
          <FooterLink href="https://cord.com/pricing">Pricing</FooterLink>
          <FooterLink href="https://status.cord.com/">Status</FooterLink>
          <FooterLink href="https://community.cord.com/">Community</FooterLink>
        </FooterList>
        <FooterList title="Privacy">
          <FooterLink href="https://cord.com/privacy-policy">
            Privacy Policy
          </FooterLink>
          <FooterLink href="https://cord.com/terms-of-service">
            Web Terms of Service
          </FooterLink>
          <FooterLink href="https://cord.com/service-agreement">
            Service Agreement
          </FooterLink>
          <FooterLink href="https://cord.com/legal/data-processing-agreement">
            Data Processing Agreement
          </FooterLink>
          <FooterLink href="https://cord.com/security">Security</FooterLink>
          {/* eslint-disable-next-line @cspell/spellchecker */}
          <FooterLink href="https://cord.com/ccpa">CCPA</FooterLink>
        </FooterList>
        <FooterList title="Contact">
          <FooterLink href="https://twitter.com/get_cord">Twitter</FooterLink>
          <FooterLink href="https://www.linkedin.com/company/get-cord/">
            Linkedin
          </FooterLink>
          <FooterLink href="mailto:info@cord.com">info@cord.com</FooterLink>
        </FooterList>
      </div>
    </footer>
  );
};

export default Footer;
