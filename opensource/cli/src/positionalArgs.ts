import type { InferredOptionTypes } from 'yargs';

export const idPositional = {
  id: {
    describe: 'ID of the object',
    string: true,
    demandOption: true,
  },
} as const;
export type IdPositionalT = InferredOptionTypes<typeof idPositional>;

export const userIdPositional = {
  userID: {
    describe: 'ID of the user',
    string: true,
    demandOption: true,
  },
} as const;
export type UserIdPositionalT = InferredOptionTypes<typeof userIdPositional>;

export const groupIdPositional = {
  groupID: {
    describe: 'ID of the group',
    string: true,
    demandOption: true,
  },
} as const;
export type GroupIdPositionalT = InferredOptionTypes<typeof groupIdPositional>;
