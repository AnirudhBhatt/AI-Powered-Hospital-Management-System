'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Building, Users, ClipboardList, Settings, UserCog, Stethoscope, CalendarDays, Pill, FlaskConical, FolderOpen, Bot, HeartPulse, BedDouble, BarChart3, UserPlus, ClipboardCheck, FileText, Package, Receipt, CreditCard, Shield, Activity, LogOut } from 'lucide-react';

// Navigation configuration per role
const NAV_CONFIG = {
  super_admin: [
    { label: 'Dashboard',   href: '/dashboard/super-admin',               icon: <LayoutDashboard size={18} /> },
    { label: 'Hospitals',   href: '/dashboard/super-admin/hospitals',      icon: <Building2 size={18} /> },
    { label: 'Departments', href: '/dashboard/super-admin/departments',    icon: <Building size={18} /> },
    { label: 'Admins',      href: '/dashboard/super-admin/admins',         icon: <Users size={18} /> },
    { label: 'Audit Logs',  href: '/dashboard/super-admin/audit-logs',     icon: <ClipboardList size={18} /> },
    { label: 'Settings',    href: '/dashboard/super-admin/settings',       icon: <Settings size={18} /> },
  ],
  hospital_admin: [
    { label: 'Dashboard',    href: '/dashboard/admin',               icon: <LayoutDashboard size={18} /> },
    { label: 'Doctors',      href: '/dashboard/admin/doctors',        icon: <Stethoscope size={18} /> },
    { label: 'Staff',        href: '/dashboard/admin/staff',          icon: <UserCog size={18} /> },
    { label: 'Departments',  href: '/dashboard/admin/departments',    icon: <Building size={18} /> },
    { label: 'Rooms',        href: '/dashboard/admin/rooms',          icon: <BedDouble size={18} /> },
    { label: 'Reports',      href: '/dashboard/admin/reports',        icon: <BarChart3 size={18} /> },
    { label: 'AI Insights',  href: '/dashboard/admin/ai-insights',   icon: <Bot size={18} /> },
  ],
  doctor: [
    { label: 'Dashboard',       href: '/dashboard/doctor',                icon: <LayoutDashboard size={18} /> },
    { label: 'My Patients',     href: '/dashboard/doctor/patients',       icon: <Users size={18} /> },
    { label: 'Appointments',    href: '/dashboard/doctor/appointments',   icon: <CalendarDays size={18} /> },
    { label: 'Prescriptions',   href: '/dashboard/doctor/prescriptions',  icon: <Pill size={18} /> },
    { label: 'Lab Orders',      href: '/dashboard/doctor/lab-orders',     icon: <FlaskConical size={18} /> },
    { label: 'Medical Records', href: '/dashboard/doctor/records',        icon: <FolderOpen size={18} /> },
    { label: 'AI Summarizer',   href: '/dashboard/doctor/ai',             icon: <Bot size={18} /> },
  ],
  nurse: [
    { label: 'Dashboard',   href: '/dashboard/nurse',          icon: <LayoutDashboard size={18} /> },
    { label: 'My Patients', href: '/dashboard/nurse/patients', icon: <Users size={18} /> },
    { label: 'Vitals',      href: '/dashboard/nurse/vitals',   icon: <HeartPulse size={18} /> },
  ],
  receptionist: [
    { label: 'Dashboard',           href: '/dashboard/receptionist',              icon: <LayoutDashboard size={18} /> },
    { label: 'Appointments',        href: '/dashboard/receptionist/appointments', icon: <CalendarDays size={18} /> },
    { label: 'Register Patient',    href: '/dashboard/receptionist/register',     icon: <UserPlus size={18} /> },
    { label: 'Doctor Availability', href: '/dashboard/receptionist/availability', icon: <Stethoscope size={18} /> },
  ],
  lab_technician: [
    { label: 'Dashboard',      href: '/dashboard/lab',         icon: <LayoutDashboard size={18} /> },
    { label: 'Lab Tests',      href: '/dashboard/lab/tests',   icon: <FlaskConical size={18} /> },
    { label: 'Upload Reports', href: '/dashboard/lab/reports', icon: <FileText size={18} /> },
  ],
  pharmacist: [
    { label: 'Dashboard',     href: '/dashboard/pharmacist',               icon: <LayoutDashboard size={18} /> },
    { label: 'Prescriptions', href: '/dashboard/pharmacist/prescriptions', icon: <ClipboardCheck size={18} /> },
    { label: 'Inventory',     href: '/dashboard/pharmacist/inventory',     icon: <Package size={18} /> },
  ],
  billing_executive: [
    { label: 'Dashboard', href: '/dashboard/billing',           icon: <LayoutDashboard size={18} /> },
    { label: 'Invoices',  href: '/dashboard/billing/invoices',  icon: <Receipt size={18} /> },
    { label: 'Payments',  href: '/dashboard/billing/payments',  icon: <CreditCard size={18} /> },
    { label: 'Insurance', href: '/dashboard/billing/insurance', icon: <Shield size={18} /> },
  ],
  patient: [
    { label: 'Dashboard',     href: '/dashboard/patient',               icon: <LayoutDashboard size={18} /> },
    { label: 'Appointments',  href: '/dashboard/patient/appointments',  icon: <CalendarDays size={18} /> },
    { label: 'Prescriptions', href: '/dashboard/patient/prescriptions', icon: <Pill size={18} /> },
    { label: 'Reports',       href: '/dashboard/patient/reports',       icon: <BarChart3 size={18} /> },
    { label: 'Billing',       href: '/dashboard/patient/billing',       icon: <Receipt size={18} /> },
    { label: 'AI Assistant',  href: '/dashboard/patient/ai',            icon: <Bot size={18} /> },
  ],
};

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatRole(role) {
  if (!role) return '';
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = user?.role ? (NAV_CONFIG[user.role] || []) : [];
  const displayName = user?.name || user?.email || 'User';
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><Activity size={20} color="white" /></div>
        {!collapsed && (
          <div>
            <div className="sidebar-logo-text">HMS Pro</div>
            <div className="sidebar-logo-sub">Hospital System</div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {!collapsed && (
            <div className="sidebar-section-title">Navigation</div>
          )}
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item${isActive ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Footer: user info + collapse toggle ── */}
      <div className="sidebar-footer">
        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name truncate">{displayName}</div>
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
          )}
        </div>

        {/* Logout */}
        {!collapsed ? (
          <button
            className="btn btn-ghost btn-sm w-full"
            style={{ marginTop: '8px', justifyContent: 'center', color: 'var(--danger)' }}
            onClick={logout}
          >
            <LogOut size={16} /> Logout
          </button>
        ) : (
          <button
            className="btn btn-ghost btn-icon"
            style={{ width: '100%', marginTop: '8px', color: 'var(--danger)' }}
            title="Logout"
            onClick={logout}
          >
            <LogOut size={16} />
          </button>
        )}

        {/* Collapse toggle */}
        <button
          className="btn btn-ghost btn-sm"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginTop: '8px',
            color: 'var(--text-muted)',
          }}
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
