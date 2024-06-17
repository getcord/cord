/** @jsxImportSource @emotion/react */

type StepByStepGuideProps = {
  startNumber?: number;
  includesFinalStep?: boolean;
  children: React.ReactNode[];
};

function StepByStepGuide({
  startNumber = 1,
  includesFinalStep,
  children,
}: StepByStepGuideProps) {
  return (
    <div>
      {children.map((child, idx) => {
        const isLast = idx === children.length - 1;
        return (
          <div
            key={'guide-step-' + idx}
            css={{
              position: 'relative',
              paddingLeft: 48,
              paddingBottom: 16,
              // The circled number
              '&:before': {
                alignItems: 'center',
                backgroundColor:
                  isLast && includesFinalStep
                    ? 'var(--color-green)'
                    : 'var(--color-purple)',
                border: '8px #fff solid',
                borderRadius: '100%',
                color: '#fff',
                content:
                  isLast && includesFinalStep
                    ? '"✓"'
                    : '"' + (startNumber + idx) + '"',
                display: 'flex',
                fontSize: 16,
                fontWeight: 700,
                height: 50,
                justifyContent: 'center',
                left: -8,
                lineHeight: '16px',
                position: 'absolute',
                top: -8,
                width: 50,
                zIndex: 1,
              },
              ...(!isLast
                ? {
                    // The vertical line under the number
                    '&:after': {
                      background: 'var(--color-greylight)',
                      content: '"\\00a0"', // non-breaking space code point
                      height: 'calc(100% + 32px)',
                      left: 17,
                      position: 'absolute',
                      top: 0,
                      width: 1,
                    },
                  }
                : {}),
            }}
          >
            <div>{child}</div>
          </div>
        );
      })}
    </div>
  );
}

export default StepByStepGuide;
