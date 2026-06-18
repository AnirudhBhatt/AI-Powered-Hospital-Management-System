'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userAPI, doctorAPI } from '@/lib/api';

const DEPARTMENTS = [
  { name: 'Cardiology', icon: '❤️', head: 'Dr. Rajesh Kumar', staff: 12, status: 'Active' },
  { name: 'Neurology', icon: '🧠', head: 'Dr. Priya Sharma', staff: 8, status: 'Active' },
  { name: 'Orthopedics', icon: '🦴', head: 'Dr. Amit Patel', staff: 10, status: 'Active' },
  { name: 'General Medicine', icon: '🩺', head: 'Dr. Sunita Reddy', staff: 15, status: 'Active' },
  { name: 'Emergency', icon: '🚨', head: 'Dr. Vikram Singh', staff: 20, status: 'Active' },
  { name: 'Pediatrics', icon: '👶', head: 'Dr. Meera Iyer', staff: 9, status: 'Active' },
  { name: 'Dermatology', icon: '🧬', head: 'Dr. Arjun Nair', staff: 6, status: 'Active' },
  { name: 'Radiology', icon: '📡', head: 'Dr. Kavita Das', staff: 7, status: 'Active' },
];

export default function HospitalsPage() {
  const [loading, setLoading] = useState(true);
  const [totalStaff, setTotalStaff] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [newDept, setNewDept] = useState({ name: '', description: '', head: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [uRes, dRes] = await Promise.allSettled([
          userAPI.getAll(),
          doctorAPI.getAll(),
        ]);
        const users = uRes.status === 'fulfilled' ? (uRes.value.data || []) : [];
        const docs = dRes.status === 'fulfilled' ? (dRes.value.data || []) : [];
        setTotalStaff(users.filter(u => u.role !== 'patient').length);
        setDoctors(docs);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  function handleAddDept(e) {
    e.preventDefault();
    if (!newDept.name) return;
    setDepartments(prev => [...prev, { ...newDept, icon: '🏢', staff: 0, status: 'Active' }]);
    setNewDept({ name: '', description: '', head: '' });
    setShowModal(false);
  }

  return (
    <DashboardLayout title="Hospital Configuration" subtitle="Manage hospital settings and departments">
      {/* Hospital Banner Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)', border: 'none', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ color: 'white', fontSize: '1.6rem', marginBottom: 6 }}>🏥 Apollo Multi-Specialty Hospital</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: 4 }}>📍 123 Healthcare Avenue, Medical District, Mumbai - 400001</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>📞 +91-1234567890 &nbsp;|&nbsp; ✉️ admin@apollohms.com &nbsp;|&nbsp; 📅 Est. 2020</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', marginBottom: 24 }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="stat-card"><div className="skeleton" style={{width:48,height:48,borderRadius:12}}/><div style={{flex:1}}><div className="skeleton" style={{width:'60%',height:28,marginBottom:8}}/><div className="skeleton" style={{width:'80%',height:14}}/></div></div>)
        ) : (<>
          <div className="stat-card"><div className="stat-icon" style={{background:'#6366f122'}}><span style={{fontSize:22}}>🏥</span></div><div><div className="stat-value" style={{color:'#6366f1'}}>1</div><div className="stat-label">Total Hospitals</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'#0ea5e922'}}><span style={{fontSize:22}}>🏢</span></div><div><div className="stat-value" style={{color:'#0ea5e9'}}>{departments.length}</div><div className="stat-label">Active Departments</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'#10b98122'}}><span style={{fontSize:22}}>👥</span></div><div><div className="stat-value" style={{color:'#10b981'}}>{totalStaff}</div><div className="stat-label">Total Staff</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'#f59e0b22'}}><span style={{fontSize:22}}>⏱️</span></div><div><div className="stat-value" style={{color:'#f59e0b'}}>99.9%</div><div className="stat-label">System Uptime</div></div></div>
        </>)}
      </div>

      {/* Department Table */}
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">🏢 Departments</div><div className="card-subtitle">All hospital departments</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>➕ Add Department</button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Department</th><th>Head Doctor</th><th>Staff Count</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i}>{[1,2,3,4].map(j=><td key={j}><div className="skeleton" style={{height:14,width:'80%'}}/></td>)}</tr>)
              ) : departments.length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">🏢</div><div className="empty-state-title">No departments found</div></div></td></tr>
              ) : (
                departments.map((dept, idx) => (
                  <tr key={idx}>
                    <td><div className="flex items-center gap-2"><span>{dept.icon}</span><span className="font-semibold">{dept.name}</span></div></td>
                    <td className="text-sm">{dept.head || '—'}</td>
                    <td className="text-sm">{dept.staff}</td>
                    <td><span className="badge badge-success" style={{fontSize:'0.75rem'}}>{dept.status}</span></td>
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
            <div className="modal-header"><h3 className="modal-title">➕ Add New Department</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleAddDept}>
              <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:16}}>
                <div className="form-group"><label className="form-label">Department Name</label><input className="form-input" value={newDept.name} onChange={e=>setNewDept({...newDept,name:e.target.value})} placeholder="e.g. Cardiology" required/></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={newDept.description} onChange={e=>setNewDept({...newDept,description:e.target.value})} placeholder="Department description"/></div>
                <div className="form-group"><label className="form-label">Head Doctor</label><select className="form-select" value={newDept.head} onChange={e=>setNewDept({...newDept,head:e.target.value})}><option value="">Select Doctor</option>{doctors.map((d,i)=><option key={i} value={d.name}>{d.name} - {d.specialization}</option>)}</select></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Department</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
