import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, History, Zap, Leaf } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getHomeLink = () => {
    if (!user) return '/';
    if (user.role === UserRole.ADMIN) return '/admin/dashboard';
    if (user.role === UserRole.NGO) return '/ngo/dashboard';
    if (user.role === UserRole.STUDENT) return '/student/dashboard';
    return '/';
  };

  const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, exact = false }) => {
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute -top-px left-0 right-0 h-0.5 bg-emerald-500 mx-auto w-12 rounded-b-full"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-0">
      {/* Desktop/Tablet Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={getHomeLink()} className="flex items-center space-x-3 group">
             <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
                <Leaf size={20} fill="currentColor" />
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">FoodConnect</h1>
               <p className="text-[10px] font-medium text-emerald-600 tracking-wider uppercase">Zero Waste Initiative</p>
             </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role.toLowerCase()}</div>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-red-600"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content with Page Transition */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          key={location.pathname} // Triggers animation on route change
        >
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <div className="sm:hidden text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {user?.name.split(' ')[0]}
            </div>
          </div>
          <div className="space-y-6">
            {children}
          </div>
        </motion.div>
      </main>
      
      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-slate-400 text-sm">
            &copy; 2024 Smart Food Redistribution System. <br/>
            <span className="text-emerald-600 font-medium">Tech for Social Good</span>
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation - Sticky & Animated */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center h-[80px] pb-5 z-40 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavItem to={getHomeLink()} icon={Home} label="Home" exact={true} />
        
        {user?.role === UserRole.STUDENT && (
           <NavItem to="/student/history" icon={History} label="History" />
        )}

        {user?.role === UserRole.ADMIN && (
           <NavItem to="/admin/prediction" icon={Zap} label="Predict" />
        )}
        
        <button 
          onClick={logout}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={24} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Layout;