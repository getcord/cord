import { LocationMatch } from 'common/types/index.ts';
import type { BaseAnnotation } from 'external/src/delegate/annotations/types.ts';

export class MissingAnnotation implements BaseAnnotation {
  async getPosition() {
    return null;
  }

  async getMatchType() {
    return LocationMatch.NONE;
  }

  async isOutsideScroll() {
    return true;
  }

  async scrollTo() {
    // do nothing
  }

  async getPositionForArrow() {
    return null;
  }
}
