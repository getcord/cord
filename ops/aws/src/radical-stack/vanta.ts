import type { TagProps } from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import type { IConstruct } from 'constructs';
import xregexp from 'xregexp';

import { DEFAULT_OWNER } from 'ops/aws/src/radical-stack/Config.ts';

export interface VantaOptions extends TagProps {
  /**
   * E-mail address of person responsible for this item
   */
  owner?: string;

  /**
   * Flag to indicate a resource is not part of the production environment
   */
  nonProd?: boolean;

  /**
   * Description of what user data is stored on this resource
   *
   * @example "User emails and phone numbers"
   */
  userDataStored?: string;

  /**
   * Reason why no alarms should be raised about this resource
   *
   * @example "This stores our favorite foods and isn't part of our production
   * systems."
   */
  noAlert?: string;
}

export function vanta(
  scope: IConstruct,
  description: string,
  options: VantaOptions,
) {
  const {
    // Vanta
    owner = DEFAULT_OWNER,
    nonProd,
    userDataStored,
    noAlert,
    // tag props
    applyToLaunchedInstances,
    excludeResourceTypes,
    includeResourceTypes,
    priority,
  } = options;
  const tagProps = {
    applyToLaunchedInstances,
    excludeResourceTypes,
    includeResourceTypes,
    priority,
  };

  const tags = Tags.of(scope);

  tags.add('VantaDescription', assertValidTagValue(description), tagProps);
  tags.add('VantaOwner', assertValidTagValue(owner), tagProps);
  nonProd && tags.add('VantaNonProd', 'true', tagProps);
  if (userDataStored) {
    tags.add('VantaContainsUserData', 'true', tagProps);
    tags.add(
      'VantaUserDataStored',
      assertValidTagValue(userDataStored),
      tagProps,
    );
  }
  noAlert && tags.add('VantaNoAlert', assertValidTagValue(noAlert), tagProps);
}

// The values of tags in AWS must match the given regular expression
const validTagValueRegexp = xregexp('^[\\p{L}\\p{Z}\\p{N}_.:/=+\\-@]*$');

function assertValidTagValue(value: string) {
  if (!validTagValueRegexp.test(value)) {
    throw new Error(`Invalid AWS tag value: ${value}`);
  }
  return value;
}
