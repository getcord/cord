/** @jsxImportSource @emotion/react */

import { useState } from 'react';
import styled from '@emotion/styled';
import SwitchCodeButton from 'docs/server/ui/switchCodeButton/SwitchCodeButton.tsx';

const NEXTJS = 'Next.js';
const REMIX = 'Remix';

const REMIX_CMD =
  'npx create-remix@latest --install --template getcord/cord-remix';
const NEXT_CMD =
  'npx create-next-app@latest --example https://github.com/getcord/cord-nextjs';

export const StarterKitCardIcons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  margin-bottom: 2px;
`;
// We do not want it to appears in the "On this page" section. So not a Heading
export const StarterKitCardTitle = styled.p`
  margin: 0;
  font-weight: 700;
  line-height: 140%;
`;

const StarterKitCardContainer = styled.div`
  margin-block: 40px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  padding: 24px;
  align-items: start;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid var(--Base-x-strong, #dadce0);
  & > * {
    margin: 0;
  }
  & > code {
    padding: 8px 16px;
    margin-top: 16px;
  }
`;

const SwitchCodeButtons = styled.div`
  margin-top: 16px;
`;

export default function StarterKitCard() {
  const [selectedTemplate, setSelectedTemplate] = useState(NEXTJS);
  const selectedTemplateURL = `https://www.github.com/getcord/cord-${
    selectedTemplate === NEXTJS ? 'nextjs' : 'remix'
  }/`;
  const selectedTemplateCmd =
    selectedTemplate === NEXTJS ? NEXT_CMD : REMIX_CMD;
  return (
    <StarterKitCardContainer>
      <StarterKitCardIcons>
        <img src="/static/images/nextjs-logo.svg" alt="Next.js's logo" />
        <img src="/static/images/remix-logo.svg" alt="Remix's logo" />
      </StarterKitCardIcons>

      <StarterKitCardTitle>
        Short on time? Use one of our starter templates.
      </StarterKitCardTitle>
      <p>
        Get a working sample app with one of our{' '}
        <a href={selectedTemplateURL}>templates</a>. Choose your library and run
        this command in your terminal.
      </p>
      <SwitchCodeButtons>
        <SwitchCodeButton
          displayName={NEXTJS}
          selected={selectedTemplate === NEXTJS}
          value={-1}
          disabled={false}
          onChange={() => {
            setSelectedTemplate(NEXTJS);
          }}
        />
        <SwitchCodeButton
          displayName={REMIX}
          selected={selectedTemplate === REMIX}
          value={-1}
          disabled={false}
          onChange={() => {
            setSelectedTemplate(REMIX);
          }}
        />
      </SwitchCodeButtons>
      <code>{selectedTemplateCmd}</code>
    </StarterKitCardContainer>
  );
}
