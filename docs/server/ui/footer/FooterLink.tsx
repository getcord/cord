/** @jsxImportSource @emotion/react */

type FooterLinkProps = {
  href: string;
  children: React.ReactNode;
};

function FooterLink({ children, href }: FooterLinkProps) {
  return (
    <li css={{ marginBottom: 4 }}>
      <a
        href={href}
        css={{
          color: 'var(--color-greylight)',
          // eslint-disable-next-line @cspell/spellchecker
          fontFamily: 'abc_favoritbook, sans-serif',
          fontSize: 16,
          lineHeight: '24px',
          textDecoration: 'none',
          '&:link': {
            color: 'var(--color-greylight)',
            textDecoration: 'none',
          },
          '&:hover': {
            color: 'var(--color-greylight)',
            textDecoration: 'underline',
          },
          '&:active': {
            color: 'var(--color-greylight)',
            textDecoration: 'underline',
          },
          '&:visited': {
            color: 'var(--color-greylight)',
          },
        }}
      >
        {children}
      </a>
    </li>
  );
}

export default FooterLink;
