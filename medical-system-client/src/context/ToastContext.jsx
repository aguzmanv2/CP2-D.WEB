import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toast } from '../components/ui/index.jsx';

export const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {}
});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback((payload) => {
    const nextToast = {
      id: Date.now(),
      type: 'info',
      title: '',
      description: '',
      ...payload
    };

    setToast(nextToast);

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const api = useMemo(
    () => ({
      showToast,
      success: (payload) => showToast({ ...payload, type: 'success' }),
      error: (payload) => showToast({ ...payload, type: 'error' }),
      info: (payload) => showToast({ ...payload, type: 'info' })
    }),
    [showToast]
  );

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    []
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <div className="fixed right-4 top-4 z-[60] w-full max-w-sm">
          <Toast title={toast.title} description={toast.description} type={toast.type} />
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
