'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { notificationAPI } from '@/lib/api';
import { Bell, BellOff, Menu } from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TopBar({ title, subtitle, onToggleSidebar }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await notificationAPI.getAll('limit=5&sort=-createdAt');
        const data = Array.isArray(res.data) ? res.data : res.data?.notifications || [];
        setNotifications(data.slice(0, 5));
        setUnreadCount(data.filter((n) => !n.isRead).length);
      } catch {
        // Silently fail – notifications are non-critical
      }
    }
    if (user) fetchNotifications();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  async function handleMarkRead(id) {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }

  const displayName = user?.name || user?.email || 'User';
  const initials = getInitials(displayName);

  return (
    <header className="topbar">
      {/* Left: hamburger + title */}
      <div className="topbar-left">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          {title && <div className="topbar-title">{title}</div>}
          {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
        </div>
      </div>

      {/* Right: notification bell + avatar */}
      <div className="topbar-right">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            className="notif-bell"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={handleMarkAllRead}
                    style={{ color: 'var(--primary-light)' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <div className="empty-state-icon"><BellOff size={24} /></div>
                  <div className="empty-state-title">No notifications</div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`notif-item${!notif.isRead ? ' unread' : ''}`}
                    onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                  >
                    <div className="notif-item-title">{notif.title || 'Notification'}</div>
                    <div className="notif-item-message">
                      {notif.message || notif.body || ''}
                    </div>
                    <div className="notif-item-time">
                      {formatTimeAgo(notif.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="sidebar-avatar" title={displayName}>
          {initials}
        </div>
      </div>
    </header>
  );
}
