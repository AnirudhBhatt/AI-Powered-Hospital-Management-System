'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { doctorAPI } from '@/lib/api';

const DEPT_OPTIONS = ['All Departments','Cardiology','Neurology','Orthopedics','General Medicine','Emergency','Pediatrics','Dermatology','Radiology'];
const TIME_SLOTS = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'];

export default function AvailabilityPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        const res = await doctorAPI.getAll();
        setDoctors(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchDoctors();
  }, []);

  function getInitials(name) {
    return (name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function getAvailableSlots() {
    const dayOfWeek = new Date(selectedDate).getDay();
    // Weekend = fewer slots
    if (dayOfWeek === 0) return [];
    if (dayOfWeek === 6) return TIME_SLOTS.slice(0, 4);
    return TIME_SLOTS;
  }

  function isAvailable(doctor) {
    const slots = getAvailableSlots();
    // Simulate: mark some as unavailable based on index
    return slots.length > 0;
  }

  const filtered = doctors.filter(d => {
    const matchDept = deptFilter === 'All Departments' || (d.specialization || '').toLowerCase().includes(deptFilter.toLowerCase());
    const matchSearch = (d.name || '').toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  const availableCount = filtered.filter(d => isAvailable(d)).length;
  const unavailableCount = filtered.length - availableCount;

  const doctorColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

  return (
    <DashboardLayout title="Doctor Availability" subtitle="Check doctor schedules and availability">
      <div className="page-header" style={{marginBottom:24}}>
        <div><h1 className="page-title">🩺 Doctor Availability</h1><p className="page-subtitle">Check doctor schedules and book appointments</p></div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',marginBottom:24}}>
        <div className="stat-card"><div className="stat-icon" style={{background:'#6366f122'}}><span style={{fontSize:22}}>👨⚕️</span></div><div><div className="stat-value" style={{color:'#6366f1'}}>{doctors.length}</div><div className="stat-label">Total Doctors</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#10b98122'}}><span style={{fontSize:22}}>✅</span></div><div><div className="stat-value" style={{color:'#10b981'}}>{availableCount}</div><div className="stat-label">Available Today</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#ef444422'}}><span style={{fontSize:22}}>🚫</span></div><div><div className="stat-value" style={{color:'#ef4444'}}>{unavailableCount}</div><div className="stat-label">Unavailable</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#f59e0b22'}}><span style={{fontSize:22}}>📅</span></div><div><div className="stat-value" style={{color:'#f59e0b'}}>{getAvailableSlots().length}</div><div className="stat-label">Time Slots</div></div></div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4" style={{marginBottom:20,flexWrap:'wrap'}}>
        <div className="search-bar" style={{flex:1,maxWidth:300}}>
          <span style={{marginRight:8}}>🔍</span>
          <input className="form-input" placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} style={{border:'none',background:'transparent',flex:1,outline:'none',color:'inherit'}} />
        </div>
        <select className="form-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{maxWidth:200}}>
          {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input className="form-input" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{maxWidth:180}} />
      </div>

      {/* Doctor Grid */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="card" style={{padding:24}}><div className="skeleton" style={{width:56,height:56,borderRadius:'50%',marginBottom:16}}/><div className="skeleton" style={{width:'60%',height:20,marginBottom:8}}/><div className="skeleton" style={{width:'100%',height:14}}/></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🩺</div><div className="empty-state-title">No doctors found matching your criteria</div></div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
          {filtered.map((doc, idx) => {
            const available = isAvailable(doc);
            const slots = getAvailableSlots();
            const color = doctorColors[idx % doctorColors.length];
            const fee = doc.consultationFee || (500 + (idx * 100));
            return (
              <div key={doc._id || idx} className="card" style={{padding:0,overflow:'hidden'}}>
                <div style={{padding:24}}>
                  <div className="flex items-center gap-4" style={{marginBottom:16}}>
                    <div style={{width:56,height:56,borderRadius:'50%',background:color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:color,flexShrink:0}}>
                      {getInitials(doc.name)}
                    </div>
                    <div style={{flex:1}}>
                      <div className="font-semibold" style={{marginBottom:2}}>{doc.name || 'Unknown'}</div>
                      <div className="text-xs text-muted">{doc.specialization || 'General'}</div>
                      <div className="text-xs text-muted">{doc.department || doc.specialization || '—'}</div>
                    </div>
                    <span className={`badge ${available ? 'badge-success' : 'badge-danger'}`} style={{fontSize:'0.7rem'}}>
                      {available ? '✅ Available' : '🚫 Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between" style={{marginBottom:12,padding:'8px 12px',background:'var(--bg-secondary)',borderRadius:8}}>
                    <span className="text-xs text-muted">Consultation Fee</span>
                    <span className="text-sm font-semibold" style={{color:'#10b981'}}>₹{fee}</span>
                  </div>

                  {available && slots.length > 0 && (
                    <div style={{marginBottom:16}}>
                      <div className="text-xs font-semibold" style={{marginBottom:8,color:'var(--text-muted)'}}>Available Slots:</div>
                      <div className="flex gap-2" style={{flexWrap:'wrap'}}>
                        {slots.slice(0, 6).map((slot, si) => (
                          <span key={si} className="badge badge-secondary" style={{fontSize:'0.7rem',cursor:'pointer'}}>{slot}</span>
                        ))}
                        {slots.length > 6 && <span className="text-xs text-muted">+{slots.length - 6} more</span>}
                      </div>
                    </div>
                  )}

                  <button className="btn btn-primary btn-sm" style={{width:'100%',justifyContent:'center'}} disabled={!available}>
                    📅 Book Appointment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
