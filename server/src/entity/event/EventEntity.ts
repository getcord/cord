import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID, JsonObject, Tier } from 'common/types/index.ts';
import type { Session } from 'server/src/auth/index.ts';

@Table({
  tableName: 'events',
  timestamps: false,
})
export class EventEntity extends Model {
  @PrimaryKey
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: UUID;

  // The unique load of the page/DOM instance (i.e. window/DOM object) where
  // the event was generated
  @Column({
    type: DataTypes.UUID,
  })
  pageLoadID!: UUID;

  // The unique id of the extension installation
  @Column({
    type: DataTypes.UUID,
  })
  installationID!: UUID | null;

  // The version of the client logging this event
  @Column({
    type: DataTypes.TEXT,
  })
  version!: string | null;

  // The version of the client logging this event
  @Column({
    type: DataTypes.JSONB,
  })
  utmParameters!: Session['utmParameters'] | null;

  // The logged-in user when the event was generated (if there was one)
  @Column({
    type: DataTypes.UUID,
  })
  userID!: UUID | null;

  // The user profile when the event was generated (if there was one)
  @Column({
    type: DataTypes.UUID,
  })
  orgID!: UUID | null;

  // The platformApplicationID when the event was generated (if there was one)
  @Column({
    type: DataTypes.UUID,
  })
  platformApplicationID!: UUID | null;

  // A monotically increasing (and usually sequential) index starting
  // from zero at the beginning of the page that should help clarify
  // the order of events in the case that the timestamps are inscrutable or too
  // close to call.
  @Column({
    type: DataTypes.NUMBER,
  })
  eventNumber!: number;

  // The timestamp as reported by the client (untrustworthy)
  @Column({
    type: DataTypes.TIME,
  })
  clientTimestamp!: Date;

  // The timestamp for when the event reached the server (not
  // guaranteed to be the time the event happened due to batching
  // on the client)
  @Column({
    type: DataTypes.TIME,
  })
  serverTimestamp!: Date;

  // An arbitrary label to differentiate this event
  @Column({
    type: DataTypes.STRING,
  })
  type!: string;

  // An arbitrary data payload to send along with the event. Please
  // be sane about what you log here. Think in 10s of bytes, not in
  // kilobytes or megabytes.
  @Column({
    type: DataTypes.JSONB,
    defaultValue: {},
  })
  payload!: JsonObject;

  // A rich set of characteristics about the browser when the event
  // generated.
  @Column({
    type: DataTypes.JSONB,
    defaultValue: {},
  })
  metadata!: JsonObject;

  @Column({
    type: DataTypes.ENUM('prod', 'staging', 'test', 'dev'),
    allowNull: false,
    primaryKey: true,
  })
  tier!: Tier;
}
