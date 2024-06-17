import freeEmailDomains from 'free-email-domains';
import type { UUID } from 'common/types/index.ts';
import { capitalizeFirstLetter } from 'common/util/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { ConsoleUserLoader } from 'server/src/entity/user/ConsoleUserLoader.ts';

export async function userHasAccessToApplication(
  viewer: Viewer,
  application: UUID,
  loader: ConsoleUserLoader,
) {
  const userEmail = viewer.developerUserID;
  if (!userEmail) {
    return false;
  }
  const user = await loader.loadUser(userEmail);
  if (!user) {
    return false;
  }
  const edge = await ApplicationEntity.findOne({
    where: { id: application, customerID: user.customerID },
  });
  return !!edge;
}

export async function consoleUserToCustomerID(
  viewer: Viewer,
  loader: ConsoleUserLoader,
) {
  const userEmail = viewer.developerUserID;
  if (!userEmail) {
    return null;
  }
  const user = await loader.loadUser(userEmail);
  if (!user?.customerID) {
    return null;
  }
  return user.customerID;
}

export function makeCustomerName(email: string) {
  const regex = /^([^@]+)@([^@.]+)\.(.+)$/;
  const matches = email.match(regex);

  if (!matches) {
    // Odd email...
    return email;
  }

  // I.e. name/domain/tld in a case like rolo@cord.com
  const [_, beforeAt, betweenAtAndFirstDot, afterFirstDot] = matches;

  if (freeEmailDomains.includes(`${betweenAtAndFirstDot}.${afterFirstDot}`)) {
    return beforeAt;
  }

  return capitalizeFirstLetter(betweenAtAndFirstDot);
}
