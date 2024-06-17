/** @jsxImportSource @emotion/react */

type GuideStepProps = {
  children: React.ReactNode;
};

function GuideStep({ children }: GuideStepProps) {
  return <section>{children}</section>;
}

export default GuideStep;
