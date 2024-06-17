/** @jsxImportSource @emotion/react */

import { H4 } from 'docs/server/ui/typography/Typography.tsx';

type GuideStepTitleProps = {
  children: React.ReactNode;
};

function GuideStepTitle({ children }: GuideStepTitleProps) {
  return <H4>{children}</H4>;
}

export default GuideStepTitle;
