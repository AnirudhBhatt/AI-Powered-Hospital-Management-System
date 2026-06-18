'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { doctorAPI } from '@/lib/api';

const DEPARTMENTS = [
  { name: 'Cardiology', icon: '❤️', description: 'Diagnosis and treatment of heart and cardiovascular diseases', head: 'Dr. Rajesh Kumar', staff: 12, color: '#ef4444' },
  { name: 'Neurology', icon: '🧠', description: 'Disorders of the brain, spinal cord, and nervous system', head: 'Dr. Priya Sharma', staff: 8, color: '#8b5cf6' },
  { name: 'Orthopedics', icon: '🦴', description: 'Musculoskeletal injuries, disorders, and rehabilitation', head: 'Dr. Amit Patel', staff: 10, color: '#0ea5e9' },
  { name: 'General Medicine', icon: '🩺', description: 'Primary healthcare, diagnosis, and internal medicine', head: 'Dr. Sunita Reddy', staff: 15, color: '#10b981' },
  { name: 'Emergency', icon: '🚨', description: '24/7 critical care and emergency medical services', head: 'Dr. Vikram Singh', staff: 20, color: '#f59e0b' },
  { name: 'Pediatrics', icon: '👶', description: 'Healthcare for infants, children, and adolescents', head: 'Dr. Meera Iyer', staff: 9, color: '#ec4899' },
  { name: 'Dermatology', icon: '🧬', description: 'Treatment of skin, hair, and nail conditions', head: 'Dr. Arjun Nair', staff: 6, color: '#14b8a6' },
  { name: 'Radiology', icon: '📡', description: 'Medical imaging, X-rays, MRI, CT scans diagnostics', head: 'Dr. Kavita Das', staff: 7, color: '#6366f1' },
];

export default function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '', head: '' });

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await doctorAPI.getAll();
        setDoctors(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchDoctors();
  }, []);

  const filtered = DEPARTMENTS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const totalStaff = DEPARTMENTS.reduce((sum, d) => sum + d.staff, 0);

  function getDoctorCount(deptName) {
    return doctors.filter(d => (d.specialization || '').toLowerCase().includes(deptName.toLowerCase())).length;
  }

  return (
    <DashboardLayout title="Department Management" subtitle="Manage hospital departments and staff allocation">
      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon" style={{background:'#6366f122'}}><span style={{fontSize:22}}>🏢</span></div><div><div className="stat-value" style={{color:'#6366f1'}}>{DEPARTMENTS.length}</div><div className="stat-label">Total Departments</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#0ea5e922'}}><span style={{fontSize:22}}>👨⚕️</span></div><div><div className="stat-value" style={{color:'#0ea5e9'}}>{doctors.length}</div><div className="stat-label">Total Doctors</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#10b98122'}}><span style={{fontSize:22}}>✅</span></div><div><div className="stat-value" style={{color:'#10b981'}}>{DEPARTMENTS.length}</div><div className="stat-label">Active Departments</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#f59e0b22'}}><span style={{fontSize:22}}>👥</span></div><div><div className="stat-value" style={{color:'#f59e0b'}}>{Math.round(totalStaff / DEPARTMENTS.length)}</div><div className="stat-label">Avg Staff / Dept</div></div></div>
      </div>

      {/* Search + Add */}
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div className="search-bar" style={{flex:1,maxWidth:400}}>
          <span style={{marginRight:8}}>🔍</span>
          <input className="form-input" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} style={{border:'none',background:'transparent',flex:1,outline:'none',color:'inherit'}} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>➕ Add Department</button>
      </div>

      {/* Department Grid */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="card" style={{padding:24}}><div className="skeleton" style={{width:48,height:48,borderRadius:12,marginBottom:16}}/><div className="skeleton" style={{width:'60%',height:20,marginBottom:8}}/><div className="skeleton" style={{width:'100%',height:14}}/><div className="skeleton" style={{width:'80%',height:14,marginTop:4}}/></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🔍</div><div className="empty-state-title">No departments match your search</div></div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
          {filtered.map((dept, idx) => (
            <div key={idx} className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{height:4,background:dept.color}} />
              <div style={{padding:24}}>
                <div className="flex items-center justify-between" style={{marginBottom:12}}>
                  <span style={{fontSize:32}}>{dept.icon}</span>
                  <span className="badge badge-success" style={{fontSize:'0.7rem'}}>Active</span>
                </div>
                <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:4,color:'var(--text-primary)'}}>{dept.name}</h3>
                <p className="text-sm text-muted" style={{marginBottom:12,lineHeight:1.5}}>{dept.description}</p>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div className="flex items-center justify-between"><span className="text-xs text-muted">Head Doctor</span><span className="text-xs font-semibold">{dept.head}</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs text-muted">Staff Members</span><span className="text-xs font-semibold">{dept.staff}</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs text-muted">Doctors</span><span className="text-xs font-semibold">{getDoctorCount(dept.name)}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">➕ Add New Department</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={e => { e.preventDefault(); setShowModal(false); }}>
              <div style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
                <div className="form-group"><label className="form-label">Department Name</label><input className="form-input" value={newDept.name} onChange={e=>setNewDept({...newDept,name:e.target.value})} placeholder="e.g. Oncology" required/></div>
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
