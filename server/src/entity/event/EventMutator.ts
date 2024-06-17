import { EventEntity } from 'server/src/entity/event/EventEntity.ts';
import type { Session } from 'server/src/auth/index.ts';
import type {
  LogEventInput,
  LogLevelType,
} from 'server/src/schema/resolverTypes.ts';
import type {
  DeploymentType,
  JsonObject,
  NullableKeys,
} from 'common/types/index.ts';
import env from 'server/src/config/Env.ts';
import {
  FeatureFlags,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

export class EventMutator {
  constructor(public session: Session) {}

  async createEvent(
    input: Omit<
      NullableKeys<LogEventInput, 'eventNumber' | 'clientTimestamp'>,
      'customEventMetadata'
    >,
    version?: string | null,
    deployment?: DeploymentType | null,
  ): Promise<EventEntity | null> {
    if (
      process.env.NODE_ENV === 'production' && // in production
      !!version && // if an event has a version defined
      !version.includes('.') // and is a development version (timestamp, ex: 1607001220661)
    ) {
      return null;
    }

    // Extract the userID, orgID and applicationID from the server-side session.
    // Don't trust the client to provide that information.
    const {
      utmParameters,
      viewer: { userID, orgID, platformApplicationID },
    } = this.session;

    const platformApplication = await ApplicationEntity.findByPk(
      platformApplicationID,
    );

    // Killswitch. This table is huge, these writes can get expensive.
    const enabled = await getTypedFeatureFlagValue(
      FeatureFlags.WRITE_TO_EVENTS_TABLE,
      {
        userID: userID ?? 'anonymous',
        orgID,
        platformApplicationID: platformApplicationID ?? 'extension',
        version: version ?? null,
        customerID: platformApplication?.customerID,
      },
    );
    if (!enabled) {
      return null;
    }

    const metadata = {
      ...input.metadata,
      deployment,
    };

    return await EventEntity.create({
      ...input,
      metadata,
      userID,
      orgID,
      platformApplicationID,
      version,
      utmParameters,
      tier: env.CORD_TIER,
    });
  }
}

export function logServerEvent(args: {
  session: Session;
  type: string;
  logLevel: LogLevelType;
  payload?: JsonObject;
  metadata?: JsonObject;
}) {
  const mutator = new EventMutator(args.session);
  backgroundPromise(
    mutator.createEvent({
      pageLoadID: null,
      clientTimestamp: null,
      installationID: null,
      eventNumber: null,
      logLevel: args.logLevel,
      type: args.type,
      payload: args.payload ?? {},
      metadata: args.metadata ?? {},
    }),
  );
}
