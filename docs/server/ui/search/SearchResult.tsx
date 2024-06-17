/** @jsxImportSource @emotion/react */

type SearchResultProps = {
  url: string;
  name: string;
  index: number;
  parentName?: string;
  plainText?: string;
};
function SearchResult({
  url,
  name,
  parentName,
  plainText,
  index,
}: SearchResultProps) {
  let txt = (plainText || '').trim();
  if (txt.startsWith(name)) {
    txt = txt.substring(name.length).trim();
  }
  if (txt === 'null') {
    txt = '';
  }

  return (
    <li
      css={{
        marginBottom: 8,
        position: 'relative',
        '&:last-child': {
          marginBottom: 0,
        },
      }}
    >
      <a
        tabIndex={index + 1}
        href={url}
        css={{
          '&, &:link, &:visited, &:active': {
            borderRadius: 8,
            color: 'var(--color-notionBlack)',
            display: 'block',
            fontWeight: 'bold',
            padding: 16,
            textDecoration: 'none',
          },
          '&:hover, &:focus': {
            background: '#fff',
            color: 'var(--color-purple)',
          },
        }}
      >
        {parentName && (
          <span
            css={{
              '&&': {
                display: 'block',
                fontSize: 11,
                fontWeight: 'normal',
                textDecoration: 'none',
              },
            }}
          >
            {parentName} {'/'}
          </span>
        )}
        {name}
        {txt && (
          <span
            css={{
              '&&': {
                color: 'var(--color-greyDark)',
                display: 'block',
                fontWeight: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }}
          >
            {txt}
          </span>
        )}
      </a>
    </li>
  );
}

export default SearchResult;
