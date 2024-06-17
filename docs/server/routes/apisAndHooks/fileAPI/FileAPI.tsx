import UploadFile from 'docs/server/routes/apisAndHooks/fileAPI/UploadFile.tsx';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import Page from 'docs/server/ui/page/Page.tsx';

const uri = '/js-apis-and-hooks/file-api';
const title = 'File API';
const subtitle = 'Manage files used for message attachments';

const navItems = [
  {
    name: UploadFile.title,
    linkTo: UploadFile.uri,
    description: UploadFile.subtitle,
    component: <UploadFile.Element />,
  },
];

function FileAPI() {
  return (
    <Page
      pretitle="JavaScript APIs & Hooks"
      pretitleLinkTo="/js-apis-and-hooks"
      title={title}
      pageSubtitle={subtitle}
    >
      <IndexCardTiles cardList={navItems} />
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: FileAPI,
  navItems,
};
