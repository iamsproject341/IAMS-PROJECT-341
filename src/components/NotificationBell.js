import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, Users, BookOpen, FileText, School, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const ICON_MAP = {
  info: { Icon: Info, color: '#3b82f6' },
  success: { Icon: CheckCircle2, color: '#14b8a6' },
  warning: { Icon: AlertTriangle, color: '#f59e0b' },
  match: { Icon: Users, color: '#a855f7' },
  logbook: { Icon: BookOpen, color: '#f59e0b' },
  report: { Icon: FileText, color: '#ec4899' },
  assessment: { Icon: School, color: '#3b82f6' },
};

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationBell({ userId }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        className="btn btn-ghost"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 16, height: 16, borderRadius: 8,
            background: '#ef4444', color: 'white',
            fontSize: '0.62rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--card-bg, #152238)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxHeight: 480,
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            zIndex: 100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({unreadCount} new)</span>}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--primary)', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: 40, textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.85rem',
              }}>
                <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = ICON_MAP[n.type] || ICON_MAP.info;
                const { Icon, color } = cfg;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      cursor: n.link ? 'pointer' : 'default',
                      background: n.read ? 'transparent' : 'rgba(20,184,166,0.05)',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      position: 'relative',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = n.read ? 'var(--input-bg)' : 'rgba(20,184,166,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(20,184,166,0.05)'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${color}20`, color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: '0.84rem',
                        color: 'var(--text-primary)', marginBottom: 2,
                      }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.read && (
                      <div style={{
                        position: 'absolute', top: 16, right: 32,
                        width: 8, height: 8, borderRadius: 4,
                        background: 'var(--primary)',
                      }} />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      style={{
                        background: 'transparent', border: 'none',
                        cursor: 'pointer', color: 'var(--text-muted)',
                        padding: 2, borderRadius: 4,
                      }}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
