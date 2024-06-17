/** @jsxImportSource @emotion/react */

type DemoAppCardProps = {
  href: string;
  children: React.ReactNode;
};

export function DemoAppCard({ href, children }: DemoAppCardProps) {
  return (
    <a href={href} css={{ flex: 1, '&&': { textDecoration: 'none' } }}>
      <figure>{children}</figure>
    </a>
  );
}

type DemoAppCardTitleProps = {
  children: React.ReactNode;
};

export function DemoAppCardTitle({ children }: DemoAppCardTitleProps) {
  return (
    <h3
      css={{
        fontFamily: 'FavoritWeb',
        fontSize: '16px',
        fontWeight: 'bold',
        marginRight: '8px',
        marginTop: '12px',
      }}
    >
      {children}
    </h3>
  );
}

type DemoAppCardSubtitleProps = {
  children: React.ReactNode;
};

export function DemoAppCardSubtitle({ children }: DemoAppCardSubtitleProps) {
  return (
    <figcaption
      css={{
        fontSize: '16px',
        marginBottom: '8px',
        marginRight: '8px',
        fontFamily: 'var(--font-text)',
      }}
    >
      {children}
    </figcaption>
  );
}
