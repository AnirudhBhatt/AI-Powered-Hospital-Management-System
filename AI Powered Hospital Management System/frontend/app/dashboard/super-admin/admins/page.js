'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userAPI } from '@/lib/api';

const DEPT_OPTIONS = ['Cardiology','Neurology','Orthopedics','General Medicine','Emergency','Pediatrics','Dermatology','Radiology','Administration'];

export default function AdminsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', department: '' });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userAPI.getAll();
      setUsers(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const admins = users.filter(u => u.role === 'hospital_admin');
  const activeAdmins = admins.filter(a => a.isActive !== false);
  const inactiveAdmins = admins.filter(a => a.isActive === false);
  const filtered = admins.filter(a => {
    const q = search.toLowerCase();
    return (a.name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q);
  });

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await userAPI.create({ ...newAdmin, role: 'hospital_admin' });
      setNewAdmin({ name: '', email: '', password: '', department: '' });
      setShowModal(false);
      fetchUsers();
    } catch (e) { alert(e.message || 'Failed to create admin'); }
    finally { setSaving(false); }
  }

  async function handleToggle(id) {
    try {
      await userAPI.toggle(id);
      fetchUsers();
    } catch (e) { console.error(e); }
  }

  return (
    <DashboardLayout title="Admin Management" subtitle="Manage hospital administrators">
      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon" style={{background:'#6366f122'}}><span style={{fontSize:22}}>👤</span></div><div><div className="stat-value" style={{color:'#6366f1'}}>{admins.length}</div><div className="stat-label">Total Admins</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#10b98122'}}><span style={{fontSize:22}}>✅</span></div><div><div className="stat-value" style={{color:'#10b981'}}>{activeAdmins.length}</div><div className="stat-label">Active Admins</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#ef444422'}}><span style={{fontSize:22}}>🚫</span></div><div><div className="stat-value" style={{color:'#ef4444'}}>{inactiveAdmins.length}</div><div className="stat-label">Inactive Admins</div></div></div>
      </div>

      {/* Search + Create */}
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div className="search-bar" style={{flex:1,maxWidth:400}}>
          <span style={{marginRight:8}}>🔍</span>
          <input className="form-input" placeholder="Search admins by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{border:'none',background:'transparent',flex:1,outline:'none',color:'inherit'}} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>➕ Create Admin</button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header"><div><div className="card-title">👥 Hospital Administrators</div><div className="card-subtitle">All registered admin accounts</div></div></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i}>{[1,2,3,4,5,6].map(j=><td key={j}><div className="skeleton" style={{height:14,width:'80%'}}/></td>)}</tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👤</div><div className="empty-state-title">No administrators found</div></div></td></tr>
              ) : (
                filtered.map((admin, idx) => (
                  <tr key={admin._id || idx}>
                    <td><div className="font-semibold text-sm">{admin.name || '—'}</div></td>
                    <td className="text-sm text-muted">{admin.email || '—'}</td>
                    <td className="text-sm">{admin.department || 'Administration'}</td>
                    <td><span className={`badge ${admin.isActive !== false ? 'badge-success' : 'badge-danger'}`} style={{fontSize:'0.75rem'}}>{admin.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-xs text-muted">{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className={`btn btn-sm ${admin.isActive !== false ? 'btn-secondary' : 'btn-primary'}`} onClick={() => handleToggle(admin._id)} style={{fontSize:'0.75rem'}}>{admin.isActive !== false ? '🔒 Deactivate' : '🔓 Activate'}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">➕ Create New Admin</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={newAdmin.name} onChange={e=>setNewAdmin({...newAdmin,name:e.target.value})} placeholder="e.g. Dr. John Doe" required/></div>
                <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" value={newAdmin.email} onChange={e=>setNewAdmin({...newAdmin,email:e.target.value})} placeholder="admin@hospital.com" required/></div>
                <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={newAdmin.password} onChange={e=>setNewAdmin({...newAdmin,password:e.target.value})} placeholder="Min 6 characters" required minLength={6}/></div>
                <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={newAdmin.department} onChange={e=>setNewAdmin({...newAdmin,department:e.target.value})}><option value="">Select Department</option>{DEPT_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Admin'}</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
