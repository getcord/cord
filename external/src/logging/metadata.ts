import type { UUID } from 'common/types/index.ts';

export function eventMetadataFromPageDetails(
  providerID: UUID | null,
  pageUrl: string | null,
) {
  return {
    url: pageUrl,
    providerID: providerID,
  };
}
