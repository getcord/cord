/** @jsxImportSource @emotion/react */

type HRProps = {
  noMargin?: boolean;
};

function HR({ noMargin = false }: HRProps) {
  return (
    <hr
      css={{
        backgroundColor: 'var(--color-greylight)',
        border: 'none',
        height: '1px',
        marginBottom: noMargin ? 0 : 40,
        marginTop: noMargin ? 0 : 40,
      }}
    />
  );
}

export default HR;
