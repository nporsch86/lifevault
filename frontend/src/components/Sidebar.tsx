
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
  { icon: CalendarDays, label: 'Daily', path: '/' },
  { icon: CalendarRange, label: 'Weekly', path: '/weekly' },
  { icon: CalendarClock, label: 'Monthly', path: '/monthly' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Wallet, label: 'Expenses', path: '/expenses' },
  { icon: StickyNote, label: 'Notes', path: '/notes' },
  { icon: LinkIcon, label: 'Links', path: '/links' },
  { icon: LayoutTemplate, label: 'Templates', path: '/templates' },
  { icon: ShieldCheck, label: 'Private', path: '/private' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-[#1a1a2e] border-r border-slate-800 flex flex-col">
      <div className="p-6">
        <img src="/logo-sidebar.png" alt="Lifevault" className="h-10 w-auto" />
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all
              ${isActive 
                ? 'bg-blue-500/10 text-blue-500 shadow-lg shadow-blue-500/5' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
            `}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center px-4 py-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs mr-3">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">John Doe</p>
            <p className="text-xs text-slate-500 truncate font-medium">john@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
