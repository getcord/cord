import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { Button } from 'external/src/components/ui3/Button.tsx';
import * as classes from 'external/src/components/ui3/ActionModal.css.ts';

type CenterIn = 'screen' | 'webpage';

type Props = {
  title: string;
  paragraphs: string[];
  onConfirm: () => void;
  onReject: () => void;
  confirmButtonText: string;
  cancelButtonText: string;
  centerIn?: CenterIn;
};

export function ActionModal({
  title,
  paragraphs,
  onConfirm,
  onReject,
  confirmButtonText,
  cancelButtonText,
}: Props) {
  useEscapeListener(onReject);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={classes.actionModalBackdrop}
    >
      <div className={classes.actionModal}>
        <h2 className={classes.actionModalTitle}>{title}</h2>
        <div className={classes.actionModalContent}>
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className={classes.actionModalActions}>
          <Button
            onClick={onReject}
            buttonType="tertiary"
            size="large"
            buttonAction="cancel"
          >
            {cancelButtonText}
          </Button>
          <Button
            onClick={onConfirm}
            buttonType="primary"
            size="large"
            buttonAction="confirm"
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
