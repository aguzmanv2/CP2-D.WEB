import MainLayout from './MainLayout.jsx';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function DashboardLayout() {
  return (
    <MainLayout>
      <div className="app-dashboard">
        <Sidebar />
        <div className="app-main-column">
          <Navbar />
          <main className="app-main">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </MainLayout>
  );
}
