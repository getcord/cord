import { v4 as uuid } from 'uuid';

import type { UUID } from 'common/types/index.ts';

// Create a static page load ID when the module initialises. This should stay
// the same throughout the page's life cycle
export const pageLoadID: UUID = uuid();
