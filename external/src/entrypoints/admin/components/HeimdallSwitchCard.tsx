import { useState, useCallback } from 'react';
import { Card } from 'react-bootstrap';
import { Switch, Button } from '@material-ui/core';
import type { HeimdallSwitchFragment } from 'external/src/entrypoints/admin/graphql/operations.ts';
import { useFlipHeimdallSwitchMutation } from 'external/src/entrypoints/admin/graphql/operations.ts';

type HeimdallSwitchProps = {
  heimdallSwitch: HeimdallSwitchFragment;
  refetch: () => Promise<void>;
};

export function HeimdallSwitchCard(props: HeimdallSwitchProps) {
  const [toggle, setToggle] = useState(props.heimdallSwitch.isOn);
  const [flipSwitch] = useFlipHeimdallSwitchMutation();
  const flipSwitchMutation = useCallback(async () => {
    const result = await flipSwitch({
      variables: {
        key: props.heimdallSwitch.key,
        value: !props.heimdallSwitch.isOn,
      },
    });

    if (result.data?.flipHeimdallSwitch.success) {
      void props.refetch();
    }
  }, [flipSwitch, props]);

  return (
    <Card>
      <Card.Title>
        {'Name: '} {props.heimdallSwitch.key}
        <Switch checked={toggle} onChange={() => setToggle(!toggle)} />
      </Card.Title>
      <Button
        variant="outlined"
        aria-label="Save changes to Switch"
        color="primary"
        disabled={toggle === props.heimdallSwitch.isOn}
        onClick={() => void flipSwitchMutation()}
      >
        Update
      </Button>
    </Card>
  );
}
