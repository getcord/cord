import type { Request, Response } from 'express';

import { AuthProviderType } from 'server/src/auth/index.ts';
import {
  createPlatformOrganization,
  forwardHandlerExceptionsToNext,
  ApiCallerError,
  updatePlatformOrganizationMembers,
} from 'server/src/public/routes/platform/util.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { UUID } from 'common/types/index.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

function validateCreateOrganizationInput(data: unknown) {
  // Not updated to CreatePlatformGroupVariables because this route was already
  // deprecated anyway
  const validatedInput = validate.CreatePlatformOrganizationVariables(data);
  validateExternalID(validatedInput.id, 'id');
  return validatedInput;
}

async function createOrganizationHandler(req: Request, res: Response) {
  const {
    id, // This is the externalID but can be type string or number
    name,
    status,
    members,
    metadata,
    ...rest
  } = validateCreateOrganizationInput(req.body);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  const externalID = id.toString(); // Incase it is a number
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }
  deprecated('api: POST /v1/organizations', platformApplicationID);

  const org = await OrgEntity.findOne({
    where: {
      externalID,
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID,
    },
  });

  if (org) {
    throw new ApiCallerError('organization_already_exists', {
      message: `The platform organization with id ${org.externalID} already exists, to update organization please make a PUT request to organizations/<ORGANIZATION_ID>.`,
    });
  }
  const addedMembers: UUID[] = [];
  let newOrg: OrgEntity;
  await getSequelize().transaction(async (transaction) => {
    newOrg = await createPlatformOrganization(
      platformApplicationID,
      externalID,
      name,
      status,
      metadata,
      transaction,
    );

    if (!newOrg) {
      throw new Error('Could not create organization');
    }

    if (members) {
      const { added } = await updatePlatformOrganizationMembers(
        newOrg,
        members,
        transaction,
      );
      addedMembers.push(...added);
    }

    const application = await ApplicationEntity.findByPk(
      platformApplicationID,
      { transaction },
    );

    if (await application?.isSupportChatEnabled()) {
      await OrgMembersEntity.create(
        {
          userID: application!.supportBotID!,
          orgID: newOrg.id,
        },
        { transaction },
      );
    }
  });
  addedMembers.map((userID) => {
    backgroundPromise(publishPubSubEvent('user-identity', { userID }));
    backgroundPromise(
      publishPubSubEvent('org-member-added', { orgID: newOrg.id }, { userID }),
    );
  });
  return res.status(201).json({
    success: true,
    message: `✅ You successfully created organization ${externalID}`,
  });
}

export default forwardHandlerExceptionsToNext(createOrganizationHandler);
