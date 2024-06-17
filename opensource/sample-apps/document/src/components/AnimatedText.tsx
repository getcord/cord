import { useState, useEffect } from 'react';

/**
 * Given a string, it will animate it like it's being typed on a GDoc.
 * It only animates it when the document is visible.
 */
export function AnimatedText({
  text,
  typingUser,
  animate = true,
  onComplete,
}: {
  text: string;
  typingUser: string;
  animate?: boolean;
  onComplete?: () => void;
}) {
  // To achieve the typing animation, we start from an empty string,
  // and we progressively add some characters.
  const [currentText, setCurrentText] = useState('');
  // To add to the realism, we add a fake caret/text cursor, which
  // resembles the one in GDocs.
  const [showFakeTextCursor, setShowFakeTextCursor] = useState(false);

  useEffect(() => {
    if (!animate) {
      setShowFakeTextCursor(false);
      return;
    }

    const stillTyping = currentText.length < text.length;
    if (stillTyping) {
      setShowFakeTextCursor(true);
      setTimeout(() => {
        setCurrentText((prevText) => text.slice(0, prevText.length + 1));
      }, getTypingDelay());
    } else {
      onComplete?.();
      setTimeout(() => {
        setShowFakeTextCursor(false);
      }, 2000);
    }
  }, [animate, currentText.length, onComplete, text]);

  return (
    <>
      {currentText}
      {showFakeTextCursor && (
        <span data-typing-user={typingUser} className="caret">
          |
        </span>
      )}
    </>
  );
}

/** How fast/slow do we want the typing effect */
function getTypingDelay(delayMs = 50) {
  return Math.random() * delayMs;
}
