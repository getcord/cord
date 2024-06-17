import { useState } from 'react';

import { Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useConsoleSlackConnect } from 'external/src/entrypoints/console/hooks/useConsoleSlackConnect.tsx';
import type { UUID } from 'common/types/index.ts';
import Modal from 'external/src/entrypoints/console/ui/Modal.tsx';

type Props = {
  applicationID: UUID;
  onSuccess: () => void;
};

export function ConnectSlackModal({ applicationID, onSuccess }: Props) {
  const navigate = useNavigate();

  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [connectSlackError, setConnectSlackError] = useState(false);
  const connectWithSlack = useConsoleSlackConnect({
    onSuccess,
    onError: () => {
      setButtonDisabled(false);
      setConnectSlackError(true);
    },
    applicationID,
  });

  return (
    <Modal show={true}>
      <Modal.Body>
        <p>
          {!connectSlackError
            ? `Support messages will be sent to your Slack. Connect your Slack, then
          select a channel to receive them on. This will enable the support user.`
            : 'Something went wrong connecting your Slack. Please try again'}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Stack direction="row" spacing={1}>
          <Button
            disabled={buttonDisabled}
            variant="contained"
            onClick={() => {
              setButtonDisabled(true);
              connectWithSlack();
            }}
          >
            Connect Slack
          </Button>
          <Button
            variant="outlined"
            disabled={buttonDisabled}
            onClick={() => {
              navigate(-1);
            }}
          >
            Go back
          </Button>
        </Stack>
      </Modal.Footer>
    </Modal>
  );
}
