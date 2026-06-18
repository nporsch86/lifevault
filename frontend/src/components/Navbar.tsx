
import { NavLink } from 'react-router-dom';
import { 
  CalendarDays, 
  CalendarRange, 
  CalendarClock, 
  CheckSquare, 
  Wallet, 
  StickyNote,
  Link as LinkIcon,
  LayoutTemplate, 
  Settings,
  ShieldCheck
} from 'lucide-react';

const menuItems = [
  { icon: CalendarDays, label: 'Daily', path: '/app' },
  { icon: CalendarRange, label: 'Weekly', path: '/app/weekly' },
  { icon: CalendarClock, label: 'Monthly', path: '/app/monthly' },
  { icon: CheckSquare, label: 'Tasks', path: '/app/tasks' },
  { icon: Wallet, label: 'Expenses', path: '/app/expenses' },
  { icon: StickyNote, label: 'Notes', path: '/app/notes' },
  { icon: LinkIcon, label: 'Links', path: '/app/links' },
  { icon: LayoutTemplate, label: 'Templates', path: '/app/templates' },
  { icon: ShieldCheck, label: 'Private', path: '/app/private' },
  { icon: Settings, label: 'Settings', path: '/app/settings' },
];

const Navbar = () => {
  return (
    <header className="h-14 bg-[#16191e] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center space-x-8 h-full">
        <NavLink to="/app" className="flex items-center">
          <img src="/logo-sidebar.png" alt="Lifevault" className="h-6 w-auto mr-2" />
        </NavLink>
        
        <nav className="hidden md:flex items-center space-x-1 h-full">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-4 h-full text-[10px] font-black uppercase tracking-widest transition-all relative group
                ${isActive 
                  ? 'text-blue-500 after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-blue-600 after:shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                  : 'text-slate-500 hover:text-slate-200'}
              `}
            >
              <item.icon className="w-4 h-4 mr-2 hidden lg:block" />
              <span className="hidden sm:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-2">
        <NavLink
          to="/app/private"
          className={({ isActive }) => `
            p-2 rounded-xl transition-all
            ${isActive ? 'bg-purple-600/10 text-purple-500' : 'text-slate-500 hover:text-purple-400 hover:bg-slate-800'}
          `}
        >
          <ShieldCheck className="w-5 h-5" />
        </NavLink>
        <div className="w-px h-6 bg-slate-800 mx-1" />
        <button className="flex items-center space-x-3 hover:bg-slate-800 p-1 pr-3 rounded-2xl transition-all group">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
            JD
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-[10px] font-black text-slate-200 leading-none">John Doe</p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
