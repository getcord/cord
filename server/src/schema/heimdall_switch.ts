import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const heimdallSwitchResolver: Resolvers['HeimdallSwitch'] = {
  isOn: (heimdallEntity, _args, _context) => {
    return heimdallEntity.isOn();
  },
};
