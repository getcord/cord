import { Table, Column, Model } from 'sequelize-typescript';
import type { CreationOptional } from 'sequelize';
import { DataTypes } from 'sequelize';
import type {
  UUID,
  CustomLinks,
  CustomNUX,
  ApplicationEnvironment,
} from 'common/types/index.ts';
import { getTypedFeatureFlagValue } from 'server/src/featureflags/index.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';

export type CustomEmailTemplate = {
  partnerName: string;
  imageURL: string;
  sender?: string;
  logoConfig?: { height: string; width: string };
};

export type ApplicationTierType = 'free' | 'starter' | 'premium';

export type CustomSlackAppDetails = {
  clientID: string;
  clientSecret: string;
  signingSecret: string;
};

@Table({
  tableName: 'applications',
  timestamps: false,
})
export class ApplicationEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: UUID;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataTypes.TEXT,
  })
  sharedSecret!: string;

  @Column({ type: DataTypes.TIME })
  createdTimestamp!: CreationOptional<Date>;

  @Column({
    type: DataTypes.JSONB,
  })
  customEmailTemplate!: CustomEmailTemplate | null;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  })
  enableEmailNotifications!: boolean;

  @Column({
    type: DataTypes.JSONB,
  })
  customLinks!: CustomLinks | null;

  @Column({
    type: DataTypes.UUID,
    defaultValue: null,
  })
  customS3Bucket!: UUID | null; // the s3 bucket to be used for this application

  @Column({
    type: DataTypes.TEXT,
    defaultValue: null,
  })
  segmentWriteKey!: string | null; // the Segment Write key we use to write partner events

  @Column({
    type: DataTypes.JSONB,
  })
  customNUX!: CustomNUX | null;

  @Column({
    type: DataTypes.TEXT,
  })
  iconURL!: string | null;

  @Column({
    type: DataTypes.ENUM('free', 'starter', 'premium'),
    defaultValue: 'free',
    allowNull: false,
  })
  type!: ApplicationTierType;

  @Column({
    type: DataTypes.ENUM(
      'production',
      'staging',
      'sample',
      'sampletoken',
      'demo',
    ),
    defaultValue: 'production',
    allowNull: false,
  })
  environment!: ApplicationEnvironment;

  @Column({
    type: DataTypes.UUID,
  })
  supportOrgID!: UUID | null;

  @Column({
    type: DataTypes.UUID,
  })
  supportBotID!: UUID | null;

  @Column({
    type: DataTypes.TEXT,
  })
  supportSlackChannelID!: string | null;

  @Column({
    type: DataTypes.TEXT,
  })
  redirectURI!: string | null;

  @Column({
    type: DataTypes.UUID,
    defaultValue: null,
  })
  defaultProvider!: UUID | null;

  @Column({
    type: DataTypes.UUID,
    defaultValue: null,
  })
  customerID!: UUID;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  })
  slackConnectAllOrgs!: boolean;

  @Column({
    type: DataTypes.STRING,
    defaultValue: null,
  })
  eventWebhookURL!: string | null;

  @Column({
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: null,
  })
  eventWebhookSubscriptions!: string[] | null;

  @Column({
    type: DataTypes.TEXT,
    defaultValue: null,
  })
  customSlackAppID!: string | null;

  @Column({
    type: DataTypes.JSONB,
    defaultValue: null,
  })
  customSlackAppDetails!: CustomSlackAppDetails | null;

  public async isSupportChatEnabled(): Promise<boolean> {
    const isSupportFlagEnabled = await getTypedFeatureFlagValue(
      FeatureFlags.SUPPORT_CHAT_ENABLED,
      {
        userID: 'anonymous',
        orgID: undefined,
        platformApplicationID: this.id,
        version: null,
        customerID: this.customerID,
      },
    );

    return Boolean(
      isSupportFlagEnabled &&
        this.supportBotID &&
        this.supportOrgID &&
        this.supportSlackChannelID,
    );
  }

  public getCustomSlackAppDetails(): CustomSlackAppDetails | null {
    const details = this.customSlackAppDetails;

    if (
      details &&
      typeof details === 'object' &&
      !Array.isArray(details) &&
      typeof details.clientID === 'string' &&
      typeof details.clientSecret === 'string' &&
      typeof details.signingSecret === 'string'
    ) {
      return {
        clientID: details.clientID,
        clientSecret: details.clientSecret,
        signingSecret: details.signingSecret,
      };
    }
    return null;
  }
}
