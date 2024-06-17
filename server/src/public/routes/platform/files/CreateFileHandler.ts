import { readFile, unlink } from 'fs/promises';
import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { validateFileForUpload } from 'common/uploads/index.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { assertValid } from 'server/src/public/routes/platform/files/util.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { FileMutator } from 'server/src/entity/file/FileMutator.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';

async function createFileHandler(req: Request, res: Response) {
  try {
    const platformApplicationID = req.appID;

    if (!platformApplicationID) {
      throw new ApiCallerError('invalid_request');
    }

    const {
      name: explicitName,
      ownerID,
      ...rest
    } = validate.CreateFileVariables(req.body);

    // Check that all properties in CreateFileVariables are destructured
    const _: Record<string, never> = rest;

    if (!req.file) {
      throw new ApiCallerError('missing_field', {
        message: 'Missing file contents',
      });
    }

    const owner = await UserEntity.findOne({
      where: {
        externalID: ownerID,
        platformApplicationID,
      },
    });

    if (!owner) {
      throw new ApiCallerError('invalid_user_id', {
        message: 'Invalid owner ID',
      });
    }

    const name = explicitName ?? req.file.originalname;

    assertValid(
      validateFileForUpload('attachment', {
        name,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }),
    );

    const viewer = await Viewer.createLoggedInPlatformViewer({
      user: owner,
      org: null,
    });
    const loaders = await getNewLoaders(viewer);

    const fileMutator = new FileMutator(viewer, loaders);

    const file = await fileMutator.createFileForUpload(
      uuid(),
      name,
      req.file.mimetype,
      req.file.size,
    );

    const uploadURL = await file.getSignedUploadURL();

    const response = await fetch(uploadURL, {
      method: 'PUT',
      body: await readFile(req.file.path),
      headers: {
        'Content-Type': file.mimeType,
      },
    });
    if (response.status !== 200) {
      anonymousLogger().error('Error uploading file to S3', {
        uploadURL,
        statusCode: response.status,
        statusMessage: response.statusText,
      });
      res.sendStatus(500);
      return;
    }

    await fileMutator.setFileUploadStatus(file.id, 'uploaded');

    res.status(200).json({
      success: true,
      message: '✅ File created.',
      fileID: file.id,
    });
  } finally {
    if (req.file) {
      backgroundPromise(unlink(req.file.path));
    }
  }
}

export default forwardHandlerExceptionsToNext(createFileHandler);
