import { useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';

type ComponentData = { name: string; cordClass: string };

type StyleObject = {
  [key: string]: any;
};

export function ReplacementCard({
  components,
  children,
  hideReplacements,
}: {
  components: ComponentData[];
  children: React.ReactNode;
  hideReplacements?: boolean;
}) {
  const useStyles = useMemo(
    () =>
      createUseStyles({
        composerContainer: {
          ...components.reduce<StyleObject>((acc, component) => {
            switch (component.cordClass) {
              case 'cord-composer':
              case 'cord-avatar-fallback':
              case 'cord-avatar-image':
              case 'cord-thread-header-container':
                acc[
                  `&[data-hovered-component='${component.cordClass}'] .${component.cordClass}`
                ] = {
                  border: '2px solid var(--color-purple);',
                };
                break;
              default:
                acc[
                  `&[data-hovered-component='${component.cordClass}'] .${component.cordClass}`
                ] = {
                  boxShadow: '0 0 0 2px var(--color-purple);',
                };
            }
            acc[
              `&:has(.${component.cordClass}:hover) #${component.cordClass}`
            ] = {
              backgroundColor: 'var(--color-purple);',
            };
            return acc;
          }, {}),
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          background: 'var(--color-purpleLight)',
          borderRadius: 4,
          margin: '32px 0px',
          padding: '8px 24px',
          '& emoji-picker': {
            border: '2px solid var(--color-purple);',
          },
        },
        card: {
          padding: '32px 0px 64px 0px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        },
        pills: {
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
          cursor: 'pointer',
        },
        children: {
          marginTop: 64,
        },
        demoTag: {
          backgroundColor: 'var(--color-purple)',
          borderRadius: 2,
          color: '#fff',
          fontSize: 14,
          left: -20,
          padding: '2px 8px',
          pointerEvents: 'none',
          position: 'absolute',
          top: -4,
        },
      }),
    [components],
  );

  const styles = useStyles();

  const [hovered, setHovered] = useState('');
  return (
    <div data-hovered-component={hovered} className={styles.composerContainer}>
      <div className={styles.card}>
        <div className={styles.demoTag}>Live Demo</div>
        {!hideReplacements && (
          <div className={styles.pills}>
            {components?.map((component) => (
              <Pill
                {...component}
                key={component.cordClass}
                setHovered={setHovered}
                hovered={hovered}
              />
            ))}
          </div>
        )}
        <div className={styles.children}>{children}</div>
      </div>
    </div>
  );
}

const usePillStyles = createUseStyles({
  pill: {
    borderRadius: 16,
    background: '#4C4C4C',
    padding: '4px 8px',
    color: 'var(--color-base);',
    fontSize: 12,
    textDecoration: 'none',

    '&:hover': {
      color: 'var(--color-base)',
      background: 'var(--color-purple)',
    },
  },
});

function Pill(props: {
  cordClass: string;
  name: string;
  setHovered: (hovered: string) => void;
  hovered: string;
}) {
  const styles = usePillStyles();
  const { cordClass, name, setHovered, hovered } = props;

  useEffect(() => {
    if (name === 'EmojiPicker' && hovered === 'cord-emoji-picker') {
      const addEmojiButton = document?.querySelector(
        `[data-hovered-component] button[data-cord-button="select-emoji"]`,
      ) as HTMLButtonElement;

      addEmojiButton.click();
    }
  }, [cordClass, name, hovered]);
  return (
    <a
      key={cordClass}
      id={cordClass}
      onMouseEnter={() => setHovered(cordClass)}
      onMouseLeave={() => setHovered('')}
      className={styles.pill}
    >
      {name}
    </a>
  );
}
