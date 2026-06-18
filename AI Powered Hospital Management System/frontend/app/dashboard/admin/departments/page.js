'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { doctorAPI, patientAPI } from '@/lib/api';

const DEPARTMENTS = [
  { name: 'Cardiology', icon: '❤️', description: 'Heart and cardiovascular care', color: '#ef4444' },
  { name: 'Neurology', icon: '🧠', description: 'Brain and nervous system', color: '#8b5cf6' },
  { name: 'Orthopedics', icon: '🦴', description: 'Bone and joint treatment', color: '#0ea5e9' },
  { name: 'General Medicine', icon: '🩺', description: 'Primary healthcare services', color: '#10b981' },
  { name: 'Emergency', icon: '🚨', description: 'Emergency medical services', color: '#f59e0b' },
  { name: 'Pediatrics', icon: '👶', description: 'Child healthcare', color: '#ec4899' },
  { name: 'Dermatology', icon: '🧬', description: 'Skin care treatment', color: '#14b8a6' },
  { name: 'Radiology', icon: '📡', description: 'Medical imaging', color: '#6366f1' },
];

export default function AdminDepartmentsPage() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [dRes, pRes] = await Promise.allSettled([
          doctorAPI.getAll(),
          patientAPI.getAll(),
        ]);
        setDoctors(dRes.status === 'fulfilled' ? (dRes.value.data || []) : []);
        setPatients(pRes.status === 'fulfilled' ? (pRes.value.data || []) : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  function getDeptDoctors(name) {
    return doctors.filter(d => (d.specialization || '').toLowerCase().includes(name.toLowerCase()));
  }

  const filtered = DEPARTMENTS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="Department Management" subtitle="Monitor and manage hospital departments">
      <div className="page-header" style={{marginBottom:24}}>
        <div><h1 className="page-title">🏢 Department Management</h1><p className="page-subtitle">Overview of all hospital departments</p></div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon" style={{background:'#6366f122'}}><span style={{fontSize:22}}>🏢</span></div><div><div className="stat-value" style={{color:'#6366f1'}}>{DEPARTMENTS.length}</div><div className="stat-label">Total Departments</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#0ea5e922'}}><span style={{fontSize:22}}>👨⚕️</span></div><div><div className="stat-value" style={{color:'#0ea5e9'}}>{doctors.length}</div><div className="stat-label">Total Doctors</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#10b98122'}}><span style={{fontSize:22}}>🏥</span></div><div><div className="stat-value" style={{color:'#10b981'}}>{patients.length}</div><div className="stat-label">Total Patients</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#f59e0b22'}}><span style={{fontSize:22}}>📊</span></div><div><div className="stat-value" style={{color:'#f59e0b'}}>92%</div><div className="stat-label">Avg Performance</div></div></div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{maxWidth:400,marginBottom:20}}>
        <span style={{marginRight:8}}>🔍</span>
        <input className="form-input" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} style={{border:'none',background:'transparent',flex:1,outline:'none',color:'inherit'}} />
      </div>

      {/* Department Grid */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="card" style={{padding:24}}><div className="skeleton" style={{width:48,height:48,borderRadius:12,marginBottom:16}}/><div className="skeleton" style={{width:'60%',height:20,marginBottom:8}}/><div className="skeleton" style={{width:'100%',height:14}}/></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🔍</div><div className="empty-state-title">No departments match your search</div></div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
          {filtered.map((dept, idx) => {
            const deptDoctors = getDeptDoctors(dept.name);
            return (
              <div key={idx} className="card" style={{padding:0,overflow:'hidden',cursor:'pointer'}} onClick={() => setSelectedDept(selectedDept === idx ? null : idx)}>
                <div style={{height:4,background:dept.color}} />
                <div style={{padding:24}}>
                  <div className="flex items-center justify-between" style={{marginBottom:12}}>
                    <span style={{fontSize:36}}>{dept.icon}</span>
                    <span className="badge badge-success" style={{fontSize:'0.7rem'}}>Active</span>
                  </div>
                  <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:4,color:'var(--text-primary)'}}>{dept.name}</h3>
                  <p className="text-sm text-muted" style={{marginBottom:16}}>{dept.description}</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div style={{background:'var(--bg-secondary)',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                      <div className="text-sm font-semibold" style={{color:dept.color}}>{deptDoctors.length}</div>
                      <div className="text-xs text-muted">Doctors</div>
                    </div>
                    <div style={{background:'var(--bg-secondary)',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                      <div className="text-sm font-semibold" style={{color:dept.color}}>{Math.floor(Math.random() * 40) + 10}</div>
                      <div className="text-xs text-muted">Patients</div>
                    </div>
                  </div>
                  {selectedDept === idx && deptDoctors.length > 0 && (
                    <div style={{marginTop:16,borderTop:'1px solid var(--border)',paddingTop:12}}>
                      <div className="text-xs font-semibold" style={{marginBottom:8,color:'var(--text-muted)'}}>Assigned Doctors:</div>
                      {deptDoctors.slice(0, 3).map((doc, di) => (
                        <div key={di} className="flex items-center gap-2" style={{marginBottom:6}}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:dept.color + '22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:dept.color}}>{(doc.name || '?')[0]}</div>
                          <div>
                            <div className="text-xs font-semibold">{doc.name}</div>
                            <div className="text-xs text-muted">{doc.specialization}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
