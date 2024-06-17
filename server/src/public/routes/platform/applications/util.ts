import type { EmailSettings } from '@cord-sdk/types';
import {
  createDefaultSenderEmailName,
  getEmailInfoFromSenderData,
} from 'common/util/index.ts';
import type { CustomEmailTemplate } from 'server/src/entity/application/ApplicationEntity.ts';

export function emailSettingsToDbData(
  input: Partial<EmailSettings>,
  applicationName: string,
  existingData?: CustomEmailTemplate | null,
) {
  if (!input) {
    return undefined;
  }

  const { name, sender, logoConfig, imageURL } = input;

  // We do this to replicate what happens when we update a value via the
  // console UI and also prevent overriding values
  const partnerName = name ?? existingData?.partnerName ?? '';
  const emailTemplate: CustomEmailTemplate = {
    ...existingData,
    partnerName,
    imageURL: imageURL ?? existingData?.imageURL ?? '',
  };

  if (sender) {
    emailTemplate['sender'] = `${partnerName} <${sender}>`;
  } else if (!existingData?.sender) {
    const defaultSenderEmail = createDefaultSenderEmailName(applicationName);
    emailTemplate['sender'] = `${partnerName} <${defaultSenderEmail}@cord.fyi>`;
  }

  // TODO(Khadija): update the api type for logoConfig which will help with cleaning this up
  if (logoConfig) {
    if ('height' in logoConfig) {
      emailTemplate['logoConfig'] = {
        height: Math.round(logoConfig.height).toString(),
        width: 'auto',
      };
    } else if ('width' in logoConfig) {
      emailTemplate['logoConfig'] = {
        width: Math.round(logoConfig.width).toString(),
        height: 'auto',
      };
    }
  } // setting the default if not already set
  else if (!existingData?.logoConfig) {
    emailTemplate['logoConfig'] = {
      width: '140',
      height: 'auto',
    };
  }

  return emailTemplate;
}

export function customEmailTemplateToAPIData(
  data: CustomEmailTemplate | null,
  enableEmailNotifications: boolean,
): EmailSettings {
  const emailTemplate: EmailSettings = {
    name: data?.partnerName || null,
    imageURL: data?.imageURL || null,
    sender: getEmailInfoFromSenderData(data?.sender)?.emailAddress || null,
    logoConfig: null,
    enableEmailNotifications,
  };

  if (data?.logoConfig) {
    emailTemplate['logoConfig'] =
      data.logoConfig.height === 'auto'
        ? { width: Number(data.logoConfig.width) }
        : { height: Number(data.logoConfig.height) };
  }

  return emailTemplate;
}
