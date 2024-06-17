import { useRef, useState, useMemo } from 'react';
import { Pin, Thread } from '@cord-sdk/react';
import type { Location } from '@cord-sdk/types';

export function PinExample({
  user,
  location,
}: {
  user: string;
  location: Location;
}) {
  const pinComponentThreadIDInputRef = useRef<HTMLInputElement>(null);
  const defaultPinComponentThreadID = useMemo(() => {
    const org =
      user.indexOf('_') === -1
        ? 'in_first_org'
        : user.substring(user.indexOf('_') + 1);

    return `dog_${org}_with_location`;
  }, [user]);
  const [pinComponentThreadID, setPinComponentThreadID] = useState(
    defaultPinComponentThreadID,
  );
  const [pinHovered, setPinHovered] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);

  return (
    <>
      <h3>Pin component</h3>
      <p>
        A manually positioned Pin component with a corresponding Thread
        component underneath. You can change the threadId passed to both in the
        input field here:
      </p>
      <input
        ref={pinComponentThreadIDInputRef}
        placeholder="threadId"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setPinComponentThreadID(
              pinComponentThreadIDInputRef.current?.value ||
                defaultPinComponentThreadID,
            );
          }
        }}
      ></input>
      <button
        onClick={() =>
          setPinComponentThreadID(
            pinComponentThreadIDInputRef.current?.value ||
              defaultPinComponentThreadID,
          )
        }
        type="button"
      >
        Update
      </button>
      <p>
        Current threadID: <b>{pinComponentThreadID}</b>
      </p>
      <div style={{ position: 'relative' }}>
        <Pin
          threadId={pinComponentThreadID}
          style={{
            top: 100,
            left: 150,
            position: 'absolute',
            transform: pinHovered ? 'scale(1, 1)' : 'scale(0.8, 0.8)',
            transformOrigin: 'bottom left',
            transition: 'transform 0.2s',
          }}
          onClick={(_thread) => {
            setThreadOpen(!threadOpen);
          }}
          onMouseEnter={() => setPinHovered(true)}
          onMouseLeave={() => setPinHovered(false)}
          location={location}
        >
          <Thread
            style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              width: '300px',
              maxHeight: '500px',
              visibility: threadOpen ? 'visible' : 'hidden',
              // inverse of the transition on the pin
              // 1.25 === 1/0.8
              transform: pinHovered ? 'scale(1, 1)' : 'scale(1.25, 1.25)',
              transformOrigin: 'top left',
              transition: 'transform 0.2s',
            }}
            threadId={pinComponentThreadID}
            location={location}
          />
        </Pin>
        <img src={'https://placedog.net/500/375?random'}></img>
      </div>
    </>
  );
}
