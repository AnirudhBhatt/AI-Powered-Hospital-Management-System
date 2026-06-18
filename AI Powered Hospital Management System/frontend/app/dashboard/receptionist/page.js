'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { appointmentAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentAPI.getAll();
      setAppointments(res.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter today's appointments in-memory for timezone safety and robust filtering
  const todayDateString = new Date().toDateString();
  const todayAppointments = appointments.filter((appt) => {
    if (!appt.date) return false;
    return new Date(appt.date).toDateString() === todayDateString;
  });

  // Calculate stats based on today's appointments
  const totalToday = todayAppointments.length;
  const scheduledToday = todayAppointments.filter((a) => a.status === 'Confirmed').length;
  const pendingToday = todayAppointments.filter((a) => a.status === 'Requested').length;
  const cancelledToday = todayAppointments.filter((a) => a.status === 'Cancelled').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Requested':
        return 'badge-warning';
      case 'Confirmed':
        return 'badge-info';
      case 'In Consultation':
        return 'badge-primary';
      case 'Completed':
        return 'badge-success';
      case 'Cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <DashboardLayout title="Receptionist Dashboard" subtitle={`Welcome, ${user?.name || 'Receptionist'}`}>
      {loading && appointments.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="loading-spinner" />
        </div>
      ) : error ? (
        <div className="alert-emergency">{error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Stats Section */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>📅</div>
              <div>
                <div className="stat-value">{totalToday}</div>
                <div className="stat-label">Today's Appointments</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)' }}>✅</div>
              <div>
                <div className="stat-value">{scheduledToday}</div>
                <div className="stat-label">Confirmed / Scheduled</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>⏳</div>
              <div>
                <div className="stat-value">{pendingToday}</div>
                <div className="stat-label">Pending Confirmation</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>❌</div>
              <div>
                <div className="stat-value">{cancelledToday}</div>
                <div className="stat-label">Cancelled Today</div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            
            {/* Today's Appointments List */}
            <div className="card" style={{ padding: '24px 0' }}>
              <div className="card-header" style={{ padding: '0 24px 16px 24px' }}>
                <div>
                  <div className="card-title">📅 Today's Queue</div>
                  <div className="card-subtitle">{totalToday} appointment{totalToday !== 1 ? 's' : ''} listed for today</div>
                </div>
                <Link href="/dashboard/receptionist/appointments" className="btn btn-secondary btn-xs">
                  Manage All
                </Link>
              </div>

              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '24px' }}>Patient Name</th>
                      <th>Doctor</th>
                      <th>Time Slot</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointments.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center' }}>
                          <div className="empty-state" style={{ padding: '32px 0' }}>
                            <div className="empty-state-icon">📭</div>
                            <div className="empty-state-title">No appointments today</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      todayAppointments.map((appt) => (
                        <tr key={appt._id}>
                          <td className="font-semibold" style={{ paddingLeft: '24px' }}>
                            {appt.patientId?.name || 'Walk-in / Unknown'}
                          </td>
                          <td className="text-sm">
                            {appt.doctorId?.name ? `Dr. ${appt.doctorId.name}` : '—'}
                          </td>
                          <td className="text-sm">{appt.timeSlot || '—'}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(appt.status)}`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="card">
              <div className="card-header" style={{ padding: 0, marginBottom: '24px' }}>
                <div className="card-title">⚡ Reception Quick Actions</div>
              </div>
              
              <div className="grid-2" style={{ height: 'calc(100% - 48px)' }}>
                <Link href="/dashboard/receptionist/appointments?book=true" style={{ display: 'block' }}>
                  <div 
                    className="card text-center" 
                    style={{ 
                      cursor: 'pointer', 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      padding: '32px 16px', 
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      background: 'var(--bg-elevated)'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                    <div className="font-semibold text-base" style={{ marginBottom: '6px' }}>Book Appointment</div>
                    <div className="text-xs text-muted">Schedule a new visit for an existing patient</div>
                  </div>
                </Link>

                <Link href="/dashboard/receptionist/register" style={{ display: 'block' }}>
                  <div 
                    className="card text-center" 
                    style={{ 
                      cursor: 'pointer', 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      padding: '32px 16px', 
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      background: 'var(--bg-elevated)'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <div className="font-semibold text-base" style={{ marginBottom: '6px' }}>Register Patient</div>
                    <div className="text-xs text-muted">Register a new walk-in patient profile</div>
                  </div>
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
