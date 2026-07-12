import { Outlet } from 'react-router-dom';

export default function MainLayout({ children }) {
  return <div className="app-shell">{children || <Outlet />}</div>;
}
