import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { betaV2 } from '@cord-sdk/react';

export function StyledMessage(props: betaV2.MessageProps) {
  const isHighlighted = !props.message?.metadata?.highlighted;

  return <StyledBetaMessage {...props} isHighlighted={isHighlighted} />;
}

export const StyledBetaMessage = styled(betaV2.Message)<{
  isHighlighted: boolean;
}>`
  .cord-message-options-buttons {
    visibility: visible;
  }

  ${(props) =>
    props.isHighlighted &&
    css`
      box-shadow: 0px 0px 17px 6px rgba(255, 240, 120, 0.75);
    `}
`;
