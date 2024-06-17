/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import FileAPI from 'docs/server/routes/apisAndHooks/fileAPI/FileAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/file-api/uploadFile';
const title = 'Upload a file';
const subtitle = `Upload files for attaching to messages`;

const jsMethodData = apiData.types.ICordFileSDK.methods.methods.uploadFile;

function UploadFile() {
  return (
    <JsApiPage
      parent={FileAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: UploadFile,
};
