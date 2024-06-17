/** @jsxImportSource @emotion/react */

type FooterListProps = {
  title: string;
  children: React.ReactNode;
};

function FooterList({ title, children }: FooterListProps) {
  return (
    <section>
      <h6
        css={{
          color: '#797979',
          marginBottom: 8,
          fontFamily: 'var(--font-text)',
          fontSize: 16,
          fontWeight: 'normal',
          lineHeight: '24px',
        }}
      >
        {title}
      </h6>
      <ul
        css={{
          listStyleType: 'none',
          marginBottom: 32,
          padding: 0,
        }}
      >
        {children}
      </ul>
    </section>
  );
}

export default FooterList;
