import { Helmet } from 'react-helmet';
import { useCallback, useState } from 'react';
import { Button, TextField } from '@material-ui/core';
import { Spinner } from 'external/src/components/ui/Spinner.tsx';
import { HeimdallSwitchCard } from 'external/src/entrypoints/admin/components/HeimdallSwitchCard.tsx';
import {
  useCreateHeimdallSwitchMutation,
  useHeimdallSwitchesQuery,
} from 'external/src/entrypoints/admin/graphql/operations.ts';

export function Heimdall() {
  const { data, refetch } = useHeimdallSwitchesQuery();
  const [createSwitch] = useCreateHeimdallSwitchMutation();
  const [newName, setNewName] = useState('');
  const createSwitchMutator = useCallback(
    async (key: string) => {
      const result = await createSwitch({
        variables: { key },
      });

      if (result.data?.createHeimdallSwitch) {
        void refetch();
        setNewName('');
      }
    },
    [createSwitch, refetch],
  );
  return (
    <>
      <Helmet>
        <title>Cord Admin - Heimdall</title>
      </Helmet>
      <TextField
        id="standard-basic"
        label="New switch name"
        value={newName}
        onChange={(event) => setNewName(event.target.value)}
      />
      <Button
        variant="contained"
        onClick={() => void createSwitchMutator(newName ?? '')}
        disabled={!isValidName(newName)}
      >
        Create new switch
      </Button>
      {data ? (
        <>
          {data.heimdallSwitches.map((heimdall, index) => (
            <HeimdallSwitchCard
              key={index}
              heimdallSwitch={heimdall}
              refetch={async () => {
                await refetch();
              }}
            />
          ))}
        </>
      ) : (
        <Spinner />
      )}
    </>
  );
}

function isValidName(name?: string | null): boolean {
  return name !== null && name !== undefined && name !== '';
}
