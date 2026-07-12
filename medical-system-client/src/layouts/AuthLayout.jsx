import { Outlet } from 'react-router-dom';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      {children || <Outlet />}
    </div>
  );
}
