/** @jsxImportSource @emotion/react */
import Page from 'docs/server/ui/page/Page.tsx';
import Search from 'docs/server/ui/search/Search.tsx';

function SearchPage() {
  return (
    <Page
      title="Search"
      pageSubtitle="Find what you're looking for within our docs"
    >
      <Search fullPage={true} />
    </Page>
  );
}

export default SearchPage;
