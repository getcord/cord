/** @jsxImportSource @emotion/react */

export default function AnyOfItem({
  isLast,
  children,
}: React.PropsWithChildren<{ isLast: boolean }>) {
  return (
    <li
      css={{
        padding: '8px 0',
        borderBottom: !isLast ? '1px solid var(--color-greylight)' : 'none',
      }}
    >
      {children}
    </li>
  );
}
