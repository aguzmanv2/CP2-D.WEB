import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext.jsx';

export const useToast = () => useContext(ToastContext);

