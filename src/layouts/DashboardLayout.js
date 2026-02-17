import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import {
  LayoutDashboard, Settings, LogOut, BookOpen, Users, Shuffle,
  Menu, X, GraduationCap, Building2, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = profile?.role || user?.user_metadata?.role || 'student';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out');
      navigate('/login');
    } catch {
      toast.error('Sign out failed');
    }
  };

  const navItems = {
    student: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/dashboard/preferences', label: 'My Preferences', icon: Settings },
      { path: '/dashboard/logbook', label: 'Logbook', icon: BookOpen },
      { path: '/dashboard/profile', label: 'Profile', icon: GraduationCap },
    ],
    organization: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/dashboard/org-preferences', label: 'Our Preferences', icon: Settings },
      { path: '/dashboard/profile', label: 'Profile', icon: Building2 },
    ],
    coordinator: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/dashboard/matching', label: 'Matching', icon: Shuffle },
      { path: '/dashboard/profile', label: 'Profile', icon: Users },
    ],
    supervisor: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/dashboard/profile', label: 'Profile', icon: Users },
    ],
  };

  const items = navItems[role] || navItems.student;
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 45, display: 'block',
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Logo size="md" />
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: 12 }}>Account</div>
          <button className="sidebar-link" onClick={handleSignOut}>
            <LogOut size={18} />
            Sign Out
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-role">{role}</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-main">
        <header className="app-topbar">
          <button
            className="btn btn-ghost"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none' }}
            id="mobile-menu-btn"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {role === 'student' && 'Student Portal'}
            {role === 'organization' && 'Organization Portal'}
            {role === 'coordinator' && 'Coordinator Portal'}
            {role === 'supervisor' && 'Supervisor Portal'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost" style={{ position: 'relative' }}>
              <Bell size={18} />
            </button>
            <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
              {initials}
            </div>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
