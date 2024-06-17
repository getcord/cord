import { Table, Column, Model } from 'sequelize-typescript';
import type { CreationOptional } from 'sequelize';
import { DataTypes } from 'sequelize';
import type {
  CustomerImplementationStage,
  CustomerType,
  UUID,
} from 'common/types/index.ts';

export type Addons = { [key: string]: string | number | boolean };
export type BillingType = 'stripe' | 'manual';
export type PricingTier = 'free' | 'pro' | 'scale';
@Table({
  tableName: 'customers',
  timestamps: false,
})
export class CustomerEntity extends Model {
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

  @Column({
    type: DataTypes.ENUM('verified', 'sample'),
    defaultValue: 'verified',
    allowNull: false,
  })
  type!: CustomerType;

  @Column({
    type: DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['addons']),
    get() {
      const addons = this.getDataValue('addons');
      return addons['custom_s3_bucket'] ?? false;
    },
  })
  enableCustomS3Bucket!: boolean;

  @Column({
    type: DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['addons']),
    get() {
      const addons = this.getDataValue('addons');
      return addons['custom_segment_write_key'] ?? false;
    },
  })
  enableCustomSegmentWriteKey!: boolean;

  @Column({
    type: DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['addons']),
    get() {
      const addons = this.getDataValue('addons');
      return addons['customer_support'] ?? false;
    },
  })
  enableCustomerSupport!: boolean;

  @Column({
    type: DataTypes.ENUM(
      'launched',
      'implementing',
      'proof_of_concept',
      'inactive',
    ),
    allowNull: false,
    defaultValue: 'proof_of_concept',
  })
  implementationStage!: CustomerImplementationStage;

  @Column({
    type: DataTypes.TIME,
    allowNull: true,
  })
  launchDate!: Date | null;

  @Column({
    type: DataTypes.TEXT,
    allowNull: true,
  })
  slackChannel!: string | null;

  @Column({
    type: DataTypes.TEXT,
    allowNull: true,
  })
  signupCoupon!: string | null;

  @Column({
    type: DataTypes.TEXT,
    allowNull: true,
  })
  stripeCustomerID!: CreationOptional<string | null>;

  @Column({
    type: DataTypes.ENUM('free', 'pro', 'scale'),
    allowNull: true,
    defaultValue: 'free',
  })
  pricingTier!: CreationOptional<PricingTier>;

  @Column({
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: true,
    defaultValue: 'inactive',
  })
  billingStatus!: CreationOptional<string>;

  @Column({
    type: DataTypes.ENUM('stripe', 'manual'),
    allowNull: true,
    defaultValue: null,
  })
  billingType!: CreationOptional<BillingType | null>;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  addons!: CreationOptional<Addons>;

  @Column({
    type: DataTypes.TIME,
    allowNull: true,
  })
  renewalDate!: CreationOptional<Date | null>;

  @Column({
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    allowNull: false,
  })
  planDescription!: CreationOptional<string[]>;
}
