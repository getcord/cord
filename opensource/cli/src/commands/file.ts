import path from 'path';
import mime from 'mime';
import { FormData as FormDataNode } from 'formdata-node';
import { fileFromPathSync } from 'formdata-node/file-from-path';
import type { Argv, InferredOptionTypes } from 'yargs';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { prettyPrint } from 'src/prettyPrint';

async function uploadFileHandler(argv: UploadFileOptionsT) {
  const mimeType = mime.getType(path.extname(argv.file));
  const fileName = argv.name ?? path.basename(argv.file);
  const file = fileFromPathSync(path.resolve(argv.file), fileName, {
    type: mimeType || '',
  });

  const form = new FormDataNode();
  form.append('file', file, fileName);
  form.append('ownerID', argv.ownerID);

  const result = await fetchCordRESTApi('files', 'POST', form as FormData);
  prettyPrint(result);
}

const uploadFileOptions = {
  file: {
    description: 'Path to the file',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  ownerID: {
    description: 'ID of the user that owns the file',
    alias: 'ownerId',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  name: {
    description: 'Name to use for the file in Cord',
    nargs: 1,
    string: true,
  },
} as const;

type UploadFileOptionsT = InferredOptionTypes<typeof uploadFileOptions>;

export const fileCommand = {
  command: 'file',
  description:
    'Operations for managing files. For more info refer to docs: https://docs.cord.com/rest-apis/files',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'upload',
        "Upload a file to Cord's file storage: POST https://api.cord.com/v1/files",
        (yargs: Argv) => yargs.options(uploadFileOptions),
        uploadFileHandler,
      );
  },
  handler: (_: unknown) => {},
};
