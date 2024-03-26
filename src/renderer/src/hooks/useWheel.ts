import { useEffect } from 'react';

export const useWheel = (callback: () => void) => {
  useEffect(() => {
    window.addEventListener('wheel', callback);
    return () => window.removeEventListener('wheel', callback);
  }, [callback]);
};
