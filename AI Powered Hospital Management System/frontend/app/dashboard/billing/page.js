'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function BillingDashboardPage() {
  const { user } = useAuth();
  
  // Data State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await invoiceAPI.getAll();
      setInvoices(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Calculations
  const todayStr = new Date().toDateString();

  // Pending Invoices count
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Partial');
  const pendingInvoicesCount = pendingInvoices.length;

  // Collected Today: sum of paidAmount for invoices paid today
  const collectedToday = invoices.reduce((sum, inv) => {
    if (inv.paidAt && new Date(inv.paidAt).toDateString() === todayStr) {
      return sum + (inv.paidAmount || 0);
    }
    return sum;
  }, 0);

  // Pending Amount: sum of totalAmount - paidAmount for non-cancelled and non-fully paid invoices
  const pendingAmount = invoices.reduce((sum, inv) => {
    if (inv.status !== 'Cancelled' && inv.status !== 'Paid') {
      const remaining = inv.totalAmount - (inv.paidAmount || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }
    return sum;
  }, 0);

  // Insurance Claims: count of claims pending
  const pendingInsuranceClaims = invoices.filter(inv => 
    inv.insurance && 
    inv.insurance.provider && 
    inv.insurance.claimStatus === 'Pending'
  ).length;

  // Revenue trend: last 7 days collections
  const revenueTrend = (() => {
    const dailyCollections = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      dailyCollections[dateStr] = {
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        amount: 0
      };
    }

    invoices.forEach(inv => {
      if (inv.paidAt) {
        const dateStr = new Date(inv.paidAt).toDateString();
        if (dailyCollections[dateStr]) {
          dailyCollections[dateStr].amount += inv.paidAmount;
        }
      }
    });

    return Object.values(dailyCollections);
  })();

  const maxDailyRevenue = Math.max(...revenueTrend.map(d => d.amount), 1000);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Partial': return 'badge-info';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <DashboardLayout title="Billing Dashboard" subtitle="Manage patient payments, claims, and invoices">
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Billing Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name || 'Billing Executive'} — Track hospital collections & claims</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/billing/invoices" className="btn btn-primary btn-sm">
            🧾 Invoices
          </Link>
          <Link href="/dashboard/billing/insurance" className="btn btn-secondary btn-sm">
            🛡️ Insurance Claims
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-emergency">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            ⏳
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingInvoicesCount}</div>
            <div className="stat-label">Pending Invoices</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            💰
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>₹{collectedToday.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div className="stat-label">Collected Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
            💸
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div className="stat-label">Pending Amount</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.15)' }}>
            🛡️
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--secondary)' }}>{pendingInsuranceClaims}</div>
            <div className="stat-label">Insurance Claims</div>
          </div>
        </div>
      </div>

      <div className="grid-2 mt-4" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Recent Invoices Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🧾 Recent Invoices</h3>
            <Link href="/dashboard/billing/invoices" className="btn btn-ghost btn-xs" style={{ color: 'var(--primary-light)' }}>
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: '40px 0' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-icon">🧾</div>
              <div className="empty-state-title">No invoices generated yet</div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Patient</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv._id}>
                      <td className="font-semibold">{inv.invoiceId}</td>
                      <td>
                        <div>{inv.patientId?.name || 'Unknown Patient'}</div>
                        <div className="text-xs text-muted">{inv.patientId?.phone || '—'}</div>
                      </td>
                      <td className="font-bold">₹{inv.totalAmount.toFixed(2)}</td>
                      <td className="text-success font-semibold">₹{inv.paidAmount?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-xs text-muted">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Collections Trend + Quick Actions */}
        <div className="flex flex-col gap-4">
          {/* Revenue Trend Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📈 7-Day Collections Trend</h3>
            </div>
            
            <div className="chart-container" style={{ marginTop: '16px' }}>
              <div className="flex items-end justify-between gap-3" style={{ height: '180px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                {revenueTrend.map((day, idx) => {
                  const percentageHeight = (day.amount / maxDailyRevenue) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 gap-2" style={{ height: '100%', justifyContent: 'flex-end' }}>
                      <div className="text-xs font-semibold text-primary truncate" style={{ fontSize: '0.65rem' }}>
                        ₹{day.amount > 1000 ? `${(day.amount / 1000).toFixed(1)}k` : day.amount.toFixed(0)}
                      </div>
                      <div 
                        style={{ 
                          width: '100%', 
                          maxHeight: '130px',
                          height: `${Math.max(percentageHeight, 5)}%`, 
                          background: 'var(--gradient-primary)', 
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }} 
                        title={`₹${day.amount.toFixed(2)}`}
                      />
                      <div className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                        {day.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-xs text-muted mt-4">
                <span>Total 7-Day: ₹{revenueTrend.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                <span>Max: ₹{maxDailyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>⚡ Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/billing/invoices?action=new" className="btn btn-primary w-full text-center" style={{ justifyContent: 'center' }}>
                🧾 Generate Invoice
              </Link>
              <Link href="/dashboard/billing/insurance" className="btn btn-secondary w-full text-center" style={{ justifyContent: 'center' }}>
                🛡️ Review Insurance Claims
              </Link>
              <button className="btn btn-ghost w-full text-center" onClick={fetchInvoices} style={{ justifyContent: 'center', border: '1px dashed var(--border)' }}>
                🔄 Refresh Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
