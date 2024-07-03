import type {
  Location,
  ElementIdentifierVersion,
  JsonObject,
  JsonValue,
  MessageContent,
  EntityMetadata,
  UUID,
  SimpleTranslationParameters,
} from 'common/types/index.ts';
import type { JsonObjectReducerData } from 'common/util/jsonObjectReducer.ts';

// type definition for each custom graphql scalar
// At the moment this only exists because DateTime scalar is string on the
// frontend, but Date type on the backend.
export type FrontendScalars = {
  DateTime: string;
  SimpleValue: string | number | boolean;
  JSON: JsonValue;
  JSONObject: JsonObject;
  Context: Location;
  Metadata: EntityMetadata;
  SimpleTranslationParameters: SimpleTranslationParameters;
  UUID: UUID;
  MessageContent: MessageContent;
  ElementIdentifierVersion: ElementIdentifierVersion;
  JsonObjectReducerData: JsonObjectReducerData;
};
