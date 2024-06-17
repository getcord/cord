import { useEffect, useState } from 'react';

export function useDocumentVisibility() {
  const [visible, setVisible] = useState(!document.hidden);

  useEffect(() => {
    const onVisibilityChanged = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChanged);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChanged);
    };
  }, []);

  return visible;
}
