import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext.js';

export function useToast() {
  return useContext(ToastContext);
}
