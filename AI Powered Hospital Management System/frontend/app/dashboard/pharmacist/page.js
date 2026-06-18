'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { prescriptionAPI, medicineAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function PharmacistDashboardPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [presRes, medRes] = await Promise.all([
        prescriptionAPI.getAll(),
        medicineAPI.getAll(),
      ]);
      setPrescriptions(presRes.data || []);
      setMedicines(medRes.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toDateString();
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'Active');
  const dispensedToday = prescriptions.filter(p =>
    p.status === 'Dispensed' && new Date(p.updatedAt).toDateString() === today
  );
  const lowStockMedicines = medicines.filter(m => m.stock <= m.minStock);
  const now = new Date();
  const expiredMedicines = medicines.filter(m => m.expiryDate && new Date(m.expiryDate) < now);

  const stats = [
    { label: 'Pending Prescriptions', value: pendingPrescriptions.length, icon: '💊', color: 'rgba(99,102,241,0.15)', accent: 'var(--primary-light)' },
    { label: 'Low Stock Medicines', value: lowStockMedicines.length, icon: '⚠️', color: 'rgba(245,158,11,0.15)', accent: 'var(--warning)' },
    { label: 'Expired Medicines', value: expiredMedicines.length, icon: '🚫', color: 'rgba(239,68,68,0.15)', accent: 'var(--danger)' },
    { label: 'Dispensed Today', value: dispensedToday.length, icon: '✅', color: 'rgba(16,185,129,0.15)', accent: 'var(--accent)' },
  ];

  return (
    <DashboardLayout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">💊 Pharmacist Dashboard</h1>
            <p className="page-subtitle">Welcome, {user?.name || 'Pharmacist'} — Manage prescriptions & inventory</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/dashboard/pharmacist/prescriptions" className="btn btn-secondary btn-sm">📋 Prescriptions</a>
            <a href="/dashboard/pharmacist/inventory" className="btn btn-primary btn-sm">🏥 Inventory</a>
          </div>
        </div>

        {error && <div className="alert-emergency"><span>⚠️</span><span>{error}</span></div>}

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon" style={{ background: s.color }}>
                {s.icon}
              </div>
              <div>
                <div className="stat-value" style={{ color: s.accent }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Active Prescriptions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📋 Active Prescriptions</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-warning">{pendingPrescriptions.length} pending</span>
                <a href="/dashboard/pharmacist/prescriptions" className="btn btn-primary btn-xs">View All</a>
              </div>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : pendingPrescriptions.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-title">No pending prescriptions!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingPrescriptions.slice(0, 6).map(p => (
                  <div key={p._id} style={{
                    padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                        {p.patientId?.user?.name || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Dr. {p.doctorId?.user?.name || 'N/A'} · {p.medicines?.length || 0} medicine(s)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </div>
                    <a href="/dashboard/pharmacist/prescriptions" className="btn btn-success btn-xs">Dispense</a>
                  </div>
                ))}
                {pendingPrescriptions.length > 6 && (
                  <a href="/dashboard/pharmacist/prescriptions" style={{ textAlign: 'center', color: 'var(--primary-light)', fontSize: '0.8rem' }}>
                    +{pendingPrescriptions.length - 6} more prescriptions →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="card" style={{ borderColor: lowStockMedicines.length > 0 ? 'rgba(245,158,11,0.4)' : 'var(--border)' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ color: lowStockMedicines.length > 0 ? 'var(--warning)' : 'inherit' }}>
                ⚠️ Low Stock Alert
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-warning">{lowStockMedicines.length}</span>
                <a href="/dashboard/pharmacist/inventory" className="btn btn-warning btn-xs">Manage</a>
              </div>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : lowStockMedicines.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">All stock levels are healthy!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStockMedicines.slice(0, 8).map(m => (
                  <div key={m._id} style={{
                    padding: '10px 12px', background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {m.category} · Min: {m.minStock} {m.unit}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: m.stock === 0 ? 'var(--danger)' : 'var(--warning)', fontSize: '1rem' }}>
                        {m.stock} {m.unit}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In stock</div>
                    </div>
                  </div>
                ))}
                {lowStockMedicines.length > 8 && (
                  <a href="/dashboard/pharmacist/inventory" style={{ textAlign: 'center', color: 'var(--warning)', fontSize: '0.8rem' }}>
                    +{lowStockMedicines.length - 8} more items →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">⚡ Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href="/dashboard/pharmacist/prescriptions" className="btn btn-primary">📋 View Prescriptions</a>
            <a href="/dashboard/pharmacist/inventory" className="btn btn-secondary">🏥 Manage Inventory</a>
            <button className="btn btn-warning" onClick={fetchData}>🔄 Refresh Data</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
