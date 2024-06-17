import { Alert } from 'react-bootstrap';

import { Sizes } from 'common/const/Sizes.ts';

type Props = {
  errorMessage: string | null;
  clearErrorMessage: () => void;
  successMessage: string | null;
  clearSuccessMessage: () => void;
  warningMessage: string | null;
  clearWarningMessage: () => void;
  className?: string;
};

export function SubmitFormResultMessage({
  errorMessage,
  clearErrorMessage,
  successMessage,
  clearSuccessMessage,
  warningMessage,
  clearWarningMessage,
  className,
}: Props) {
  return (
    <div style={{ marginTop: Sizes.LARGE }} className={className}>
      {errorMessage && (
        <Alert variant="danger" onClose={clearErrorMessage} dismissible>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" onClose={clearSuccessMessage} dismissible>
          {successMessage}
        </Alert>
      )}
      {warningMessage && (
        <Alert variant="warning" onClose={clearWarningMessage} dismissible>
          {warningMessage}
        </Alert>
      )}
    </div>
  );
}
