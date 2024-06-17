import type { ListenerRef, Location, UserID } from './core.js';

export type GetPresentOptions = {
  exclude_durable?: boolean;
  partial_match?: boolean;
};

export type SetPresentOptions = {
  /**
   * When `true`, this is a [durable presence](https://docs.cord.com/js-apis-and-hooks/presence-api)
   * update, when `false`, or is not used, it is an [ephemeral presence](https://docs.cord.com/js-apis-and-hooks/presence-api) update.
   *
   * This value defaults to `false.`
   */
  durable?: boolean;
  /**
   * When `true`, this is an *absence* update, meaning that the user has just left
   * this [location](https://docs.cord.com/reference/location).
   * If the user is currently present at that location, it is cleared.
   * This cannot be used with a [durable presence](https://docs.cord.com/js-apis-and-hooks/presence-api) update.
   *
   * This value defaults to `false.` The user will be set as present at the location.
   */
  absent?: boolean;
  exclusive_within?: Location;
  /**
   * The ID of the group which should be able to see this presence update
   */
  groupID?: string;
};

export interface AddListenerOptions {
  partial_match?: boolean;
}

export type PresenceListener = (update: PartialUserLocationData) => void;

/**
 * Options for the `observePresence` function in the Presence API.
 */
export interface ObservePresenceOptions {
  /**
   * When `true`, only return [ephemeral
   * presence](https://docs.cord.com/js-apis-and-hooks/presence-api) records.
   *
   * This value defaults to `false`.
   */
  exclude_durable?: boolean;
  /**
   * When `true`, returns users in any [partially matching
   * location](https://docs.cord.com/reference/location), rather than in only
   * the specific location given.
   *
   * This value defaults to `false`.
   */
  partial_match?: boolean;
}

export interface PartialUserLocationData {
  /**
   * The user ID of the user this presence information is for.
   */
  id: UserID;
  /**
   * Contains information about the user's [ephemeral
   * presence](https://docs.cord.com/js-apis-and-hooks/presence-api).
   */
  ephemeral?: {
    locations: Location[] | null;
  };
  /**
   * Contains information about the user's [durable
   * presence](https://docs.cord.com/js-apis-and-hooks/presence-api).  Undefined
   * if the user does not have a durable presence
   * [set](https://docs.cord.com/js-apis-and-hooks/presence-api/setPresent). The
   * location and timestamp will be for the user's most recently-set matching
   * durable presence record (which may not be for the requested location if
   * using the `partial_match` option).
   */
  durable?: {
    location: Location;
    timestamp: Date;
  };
}

/**
 * The presence data for a single user.
 */
export interface UserLocationData extends PartialUserLocationData {
  /**
   * Contains information about the user's [ephemeral
   * presence](https://docs.cord.com/js-apis-and-hooks/presence-api).  The
   * location array can be empty if the user is not currently present at the
   * requested location.
   */
  ephemeral: {
    locations: Location[];
  };
}

export type UserPresenceInformation = {
  present: boolean;
  lastPresent: Date;
  presentLocations: Location[];
};

export type PresenceUpdateCallback = (present: UserLocationData[]) => unknown;

export interface ICordPresenceSDK {
  setPresent(location: Location, options?: SetPresentOptions): Promise<true>;

  /**
   * This method allows you to observe users who are
   * [present](https://docs.cord.com/js-apis-and-hooks/presence-api) at a
   * particular [location](https://docs.cord.com/reference/location), including
   * live updates.
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.presence.observePresence(
   *   { page: "https://cord.com", block: "id123" },
   *   (present) => present.forEach(
   *     (d) => console.log(`${d.id} is present!`)
   *   ),
   *   { exclude_durable: true },
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.presence.unobservePresence(ref);
   * ```
   * @param location - The [location](https://docs.cord.com/reference/location)
   * to fetch presence information for.
   * @param callback - This callback will be called once with the current
   * presence data, and then again every time the data changes. The argument
   * passed to the callback is an array of objects. Each object will contain the
   * fields described under "Available Data" above.
   * @param options - Options that control which presence records are returned.
   * @returns A reference number which can be passed to `unobservePresence`
   * to stop observing location data.
   */
  observePresence(
    location: Location,
    callback: PresenceUpdateCallback,
    options?: ObservePresenceOptions,
  ): ListenerRef;
  unobservePresence(ref: ListenerRef): boolean;

  /**
   * @deprecated Renamed to `observePresence`.
   */
  observeLocationData(
    location: Location,
    callback: PresenceUpdateCallback,
    options?: ObservePresenceOptions,
  ): ListenerRef;
  unobserveLocationData(ref: ListenerRef): boolean;
}

export interface ServerUpdatePresence
  extends Omit<SetPresentOptions, 'exclusive_within'> {
  /**
   * @deprecated - use groupID instead.
   */
  organizationID?: string;
  /**
   * Sets an "exclusivity region" for the ephemeral presence set by this update.
   * A user can only be present at one location for a given value of exclusiveWithin.
   * If the user becomes present at a different location with the same value of
   * exclusiveWithin, they automatically become no longer present at all other
   * locations with that value of exclusive_within.
   * This is useful to more easily track presence as a user moves among sub-locations.
   * For example, suppose we'd like to track which specific paragraph on a page
   * a user is present. We could make those updates like this:
   *
   * ```json
   * {
   *    "groupID": "<GROUP_ID>",
   *    "location": { "page": "<PAGE_ID>", "paragraph": "<PARAGRAPH_ID>" },
   *    "exclusiveWithin": { "page": "<PAGE_ID>" }
   * }
   * ```
   *
   * As a user moves around a page, their paragraphID will change, while their
   * pageID will remain the same. The above call to setPresent will mark them
   * present at their specific paragraph. However, since every update uses the
   * same exclusiveWithin, each time they are marked present at one paragraph
   * they will become no longer present at their previous paragraph.
   */
  exclusiveWithin?: Location;
  /**
   * The [location](https://docs.cord.com/reference/location) you want the user to be in.
   */
  location: Location;
}
