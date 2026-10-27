import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { InAppNotification } from '../types';
import { 
  Leaf, Bell, User as UserIcon, LogOut, CheckCircle2, 
  Menu, X, Sparkles, ShieldCheck 
} from 'lucide-react';

export const Navbar: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        apiClient.get('/notifications/'),
        apiClient.get('/notifications/unread-count/'),
      ]);
      setNotifications(listRes.data.slice(0, 5));
      setUnreadCount(countRes.data.unread_count || 0);
    } catch (e) {
      // Ignored if offline
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read/');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          {isAuthenticated && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 md:hidden"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-sm group-hover:bg-forest-800 transition-colors">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                ReRoute<span className="text-forest-600 font-extrabold ml-1">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded ml-2 border border-forest-200">
                Food Surplus Network
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Quick Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/marketplace" className="hover:text-forest-700 transition-colors">
            Marketplace
          </Link>
          <Link to="/impact" className="hover:text-forest-700 transition-colors">
            Impact Analytics
          </Link>
          {isAuthenticated && user?.role === 'DONOR' && (
            <Link to="/forecast" className="flex items-center gap-1.5 text-forest-700 hover:text-forest-900 font-semibold transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Surplus Forecast
            </Link>
          )}
        </nav>

        {/* Right Action Icons / User Info */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-forest-700 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 text-xs py-4">No recent notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl text-xs transition-colors ${
                              n.is_read ? 'bg-gray-50/50' : 'bg-forest-50/60 border border-forest-100'
                            }`}
                          >
                            <p className="font-semibold text-gray-900">{n.title}</p>
                            <p className="text-gray-600 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-gray-400 block mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Role Badge & Dropdown */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs uppercase">
                    {user.organization_name ? user.organization_name.charAt(0) : user.email.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[140px]">
                      {user.organization_name || user.email}
                    </p>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-forest-600 flex items-center gap-0.5">
                      {user.role} {user.is_verified && <ShieldCheck className="w-3 h-3 text-forest-600 inline" />}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-forest-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Join Network
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

