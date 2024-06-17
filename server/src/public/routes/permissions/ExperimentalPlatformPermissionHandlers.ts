import type { Request, Response } from 'express';
import type { EntityMetadata } from 'common/types/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  FeatureFlags,
  flagsUserFromApplication,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';
import {
  externalizeID,
  extractInternalID,
  isExternalizedID,
} from 'common/util/externalIDs.ts';

type PermissionFilter = {
  id?: string | string[];
  metadata?: EntityMetadata;
};

function multify<T>(x: T | T[]): T[] {
  if (Array.isArray(x)) {
    return x;
  } else {
    return [x];
  }
}

function filterToJsonpath(filter: PermissionFilter): string {
  const result: string[] = [];

  if (filter.id) {
    result.push(
      ...multify(filter.id).map((id) => `$.id == ${JSON.stringify(id)}`),
    );
  }

  if (filter.metadata) {
    result.push(
      ...Object.entries(filter.metadata).map(
        ([k, v]) => `$.metadata.${JSON.stringify(k)} == ${JSON.stringify(v)}`,
      ),
    );
  }

  if (result.length === 0) {
    throw new ApiCallerError('missing_field', { message: 'Empty filter' });
  }

  return result.join(' && ');
}

async function assertFeatureFlagEnabled(
  req: Request,
): Promise<ApplicationEntity> {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const app = await ApplicationEntity.findByPk(platformApplicationID);
  if (!app) {
    throw new ApiCallerError('invalid_access_token');
  }

  const enablePerms = await getTypedFeatureFlagValue(
    FeatureFlags.GRANULAR_PERMISSIONS,
    flagsUserFromApplication(app),
  );

  if (!enablePerms) {
    throw new ApiCallerError('invalid_request', {
      code: 418,
      message:
        "Permissions aren't available yet, but we'd love to hear from you if you're this eager to try them out!",
    });
  }

  return app;
}

async function createPlatformPermissionHandler(req: Request, res: Response) {
  const app = await assertFeatureFlagEnabled(req);

  const rule = await PermissionRuleEntity.create({
    platformApplicationID: app.id,
    userSelector: filterToJsonpath(req.body.userFilter),
    resourceSelector: filterToJsonpath(req.body.resourceFilter),
    permissions: multify(req.body.permission),
  });

  return res.status(201).json({
    success: true,
    message: `✅ ${externalizeID(rule.id)}`,
  });
}

async function deletePlatformPermissionHandler(req: Request, res: Response) {
  const app = await assertFeatureFlagEnabled(req);

  if (!isExternalizedID(req.params.ruleID)) {
    throw new ApiCallerError('invalid_request');
  }

  await PermissionRuleEntity.destroy({
    where: {
      id: extractInternalID(req.params.ruleID)!,
      platformApplicationID: app.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: '💀',
  });
}

export default {
  create: forwardHandlerExceptionsToNext(createPlatformPermissionHandler),
  delete: forwardHandlerExceptionsToNext(deletePlatformPermissionHandler),
};
