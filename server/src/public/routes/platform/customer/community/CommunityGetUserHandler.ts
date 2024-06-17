import type { Request, Response } from 'express';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';

import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
/**
 * This handler is used by community.cord.com (https://github.com/getcord/community)
 * to associate a user in community with a Customer of Cord.  It is locked down
 * to only community's platform application id and works off the assumption that
 * the Auth0 id is shared between the two.
 */
async function CommunityGetUserHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (platformApplicationID !== '564ddd42-7d11-4ac0-b22c-3bb4e95a3ce2') {
    return res.sendStatus(404).end();
  }
  const userID = req.params.userID;

  const result: {
    customerID?: string;
    customerName?: string;
    supportEnabled?: boolean;
  } = {};
  const consoleUser = await ConsoleUserEntity.findOne({
    where: { auth0UserID: userID },
  });
  if (!consoleUser) {
    return res.status(200).send({ result });
  }

  const customerID = consoleUser.customerID;
  if (!customerID) {
    return res.status(200).send(result);
  }

  const customer = await CustomerEntity.findByPk(customerID);
  if (!customer) {
    return res.status(200).send(result);
  }

  result.customerID = customer.id;
  result.customerName = customer.name;
  // Consider if this is the right decision point for who gets custom support in community
  // We will probably also want an add-on for this at some point
  // Support can be explicitly enabled or if they are in our premium ('scale') tier
  result.supportEnabled =
    customer.enableCustomerSupport ||
    (customer.pricingTier === 'scale' && customer.billingStatus !== 'inactive');

  return res.status(200).send(result);
}

export default forwardHandlerExceptionsToNext(CommunityGetUserHandler);
