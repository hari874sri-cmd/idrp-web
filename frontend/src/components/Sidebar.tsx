import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ShoppingBag, PlusCircle, Sparkles, 
  Truck, BarChart3, Settings, ShieldAlert, HeartHandshake,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const donorLinks: SidebarLink[] = [
    { to: '/dashboard', label: 'Donor Dashboard', icon: LayoutDashboard },
    { to: '/create-donation', label: 'New Donation (AI Assist)', icon: PlusCircle, badge: 'AI' },
    { to: '/forecast', label: 'AI Surplus Forecasting', icon: Sparkles, highlight: true },
    { to: '/marketplace', label: 'Browse Marketplace', icon: ShoppingBag },
    { to: '/impact', label: 'Impact Analytics', icon: BarChart3 },
    { to: '/profile', label: 'Kitchen & Storage Settings', icon: Settings },
  ];

  const receiverLinks: SidebarLink[] = [
    { to: '/dashboard', label: 'Receiver Dashboard', icon: LayoutDashboard },
    { to: '/marketplace', label: 'Food Marketplace', icon: ShoppingBag },
    { to: '/matching', label: 'Smart Matches For Us', icon: HeartHandshake, badge: 'AI' },
    { to: '/impact', label: 'Redistribution Impact', icon: BarChart3 },
    { to: '/profile', label: 'Capacity & Preferences', icon: Settings },
  ];

  const adminLinks: SidebarLink[] = [
    { to: '/admin-dashboard', label: 'Platform Administration', icon: ShieldAlert },
    { to: '/marketplace', label: 'Moderate Marketplace', icon: ShoppingBag },
    { to: '/impact', label: 'System Analytics', icon: BarChart3 },
    { to: '/profile', label: 'Admin Settings', icon: Settings },
  ];

  const links = role === 'ADMIN' ? adminLinks : role === 'RECEIVER' ? receiverLinks : donorLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity" 
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* User mini status */}
          <div className="p-3 rounded-2xl bg-forest-50/60 border border-forest-100 flex items-center justify-between">
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider">
                {user.role} Workspace
              </span>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user.organization_name || user.email}
              </p>
            </div>
            {user.is_verified && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified Safe Partner" />
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-forest-700 text-white shadow-xs'
                        : link.highlight
                        ? 'text-forest-900 bg-forest-50/80 hover:bg-forest-100/80'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-forest-600'}`} />
                        <span>{link.label}</span>
                      </div>
                      {link.badge && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sustainability Note */}
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
          <p className="text-[11px] font-medium text-gray-500">
            Certified Zero Food Waste Initiative
          </p>
          <span className="text-[10px] text-forest-600 font-semibold block mt-0.5">
            SDG 12.3 Compliant
          </span>
        </div>
      </aside>
    </>
  );
};
