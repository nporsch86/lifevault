
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AppLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-[#1a1a2e] text-slate-200 overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden overscroll-none">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
