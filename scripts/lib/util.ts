export function maybePrintDryRunWarning({ commit }: { commit: boolean }) {
  if (!commit) {
    console.log('\n*** DRY RUN, USE --commit TO COMMIT CHANGES ***\n');
  }
}

export const COMMIT_ARG = {
  commit: {
    type: 'boolean',
    description: 'Commit changes to the database',
    default: false,
  },
} as const;
