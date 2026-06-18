'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { patientAPI } from '@/lib/api';

export default function VitalsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [vitals, setVitals] = useState({
    systolic: '', diastolic: '', heartRate: '', temperature: '', spo2: '', weight: '', notes: '',
  });
  const [vitalsHistory, setVitalsHistory] = useState([]);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patientAPI.getAll();
      setPatients(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
  });

  // Mock vitals history for display
  const mockVitalsHistory = [
    { date: '2024-01-15 09:30', bp: '120/80', hr: 72, temp: 98.6, spo2: 98, patient: 'Rahul Verma' },
    { date: '2024-01-15 10:15', bp: '140/95', hr: 88, temp: 99.2, spo2: 95, patient: 'Priya Gupta', critical: true },
    { date: '2024-01-15 11:00', bp: '118/76', hr: 68, temp: 98.4, spo2: 99, patient: 'Amit Shah' },
    { date: '2024-01-14 14:20', bp: '135/88', hr: 82, temp: 98.8, spo2: 97, patient: 'Neha Joshi' },
    { date: '2024-01-14 16:45', bp: '155/100', hr: 95, temp: 100.4, spo2: 93, patient: 'Suresh Kumar', critical: true },
  ];

  function openRecordModal(patient) {
    setSelectedPatient(patient);
    setVitals({ systolic: '', diastolic: '', heartRate: '', temperature: '', spo2: '', weight: '', notes: '' });
    setShowModal(true);
  }

  async function handleSaveVitals(e) {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      setSaving(true);
      await patientAPI.updateHistory(selectedPatient._id, {
        type: 'vitals',
        vitals: {
          bloodPressure: `${vitals.systolic}/${vitals.diastolic}`,
          heartRate: parseInt(vitals.heartRate),
          temperature: parseFloat(vitals.temperature),
          spo2: parseInt(vitals.spo2),
          weight: parseFloat(vitals.weight),
          notes: vitals.notes,
          recordedAt: new Date().toISOString(),
        },
      });
      setShowModal(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (e) { alert(e.message || 'Failed to save vitals'); }
    finally { setSaving(false); }
  }

  const criticalPatients = mockVitalsHistory.filter(v => v.critical);

  return (
    <DashboardLayout title="Vitals Management" subtitle="Record and monitor patient vital signs">
      <div className="page-header" style={{marginBottom:24}}>
        <div><h1 className="page-title">💓 Vitals Management</h1><p className="page-subtitle">Record and monitor patient vital signs</p></div>
      </div>

      {/* Critical Alert */}
      {criticalPatients.length > 0 && (
        <div className="alert-emergency" style={{marginBottom:20}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <div className="font-semibold" style={{color:'#fca5a5'}}>{criticalPatients.length} Patient(s) with Critical Vitals</div>
            <div className="text-sm text-muted">{criticalPatients.map(p => p.patient).join(' • ')}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',marginBottom:24}}>
        <div className="stat-card"><div className="stat-icon" style={{background:'#6366f122'}}><span style={{fontSize:22}}>🏥</span></div><div><div className="stat-value" style={{color:'#6366f1'}}>{patients.length}</div><div className="stat-label">Total Patients</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#10b98122'}}><span style={{fontSize:22}}>✅</span></div><div><div className="stat-value" style={{color:'#10b981'}}>{mockVitalsHistory.length}</div><div className="stat-label">Vitals Recorded Today</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#ef444422'}}><span style={{fontSize:22}}>⚠️</span></div><div><div className="stat-value" style={{color:'#ef4444'}}>{criticalPatients.length}</div><div className="stat-label">Critical Alerts</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#f59e0b22'}}><span style={{fontSize:22}}>⏱️</span></div><div><div className="stat-value" style={{color:'#f59e0b'}}>12</div><div className="stat-label">Pending Check-ups</div></div></div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{maxWidth:500,marginBottom:20}}>
        <span style={{marginRight:8}}>🔍</span>
        <input className="form-input" placeholder="Search patients by name or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{border:'none',background:'transparent',flex:1,outline:'none',color:'inherit'}} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        {/* Patient List */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">🏥 Patients</div><div className="card-subtitle">Select a patient to record vitals</div></div></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Patient</th><th>Contact</th><th>Blood Type</th><th>Action</th></tr></thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => <tr key={i}>{[1,2,3,4].map(j=><td key={j}><div className="skeleton" style={{height:14,width:'80%'}}/></td>)}</tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">🏥</div><div className="empty-state-title">No patients found</div></div></td></tr>
                ) : (
                  filtered.slice(0, 15).map((p, idx) => (
                    <tr key={p._id || idx}>
                      <td>
                        <div className="font-semibold text-sm">{p.name || '—'}</div>
                        <div className="text-xs text-muted">{p.email || ''}</div>
                      </td>
                      <td className="text-sm text-muted">{p.phone || '—'}</td>
                      <td><span className="badge badge-secondary" style={{fontSize:'0.7rem'}}>{p.bloodGroup || '—'}</span></td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => openRecordModal(p)} style={{fontSize:'0.75rem'}}>💓 Record</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vitals History */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">📋 Recent Vitals History</div><div className="card-subtitle">Latest recorded vitals</div></div></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Patient</th><th>BP</th><th>HR</th><th>Temp</th><th>SpO2</th><th>Status</th></tr></thead>
              <tbody>
                {mockVitalsHistory.map((v, idx) => (
                  <tr key={idx}>
                    <td className="text-xs text-muted">{v.date}</td>
                    <td className="text-sm font-semibold">{v.patient}</td>
                    <td className="text-sm">{v.bp}</td>
                    <td className="text-sm">{v.hr} bpm</td>
                    <td className="text-sm">{v.temp}°F</td>
                    <td className="text-sm">{v.spo2}%</td>
                    <td><span className={`badge ${v.critical ? 'badge-danger' : 'badge-success'}`} style={{fontSize:'0.7rem'}}>{v.critical ? 'Critical' : 'Normal'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Vitals Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:520}}>
            <div className="modal-header">
              <h3 className="modal-title">💓 Record Vitals — {selectedPatient?.name}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveVitals}>
              <div style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div className="form-group"><label className="form-label">Systolic (mmHg)</label><input className="form-input" type="number" value={vitals.systolic} onChange={e=>setVitals({...vitals,systolic:e.target.value})} placeholder="120" required/></div>
                  <div className="form-group"><label className="form-label">Diastolic (mmHg)</label><input className="form-input" type="number" value={vitals.diastolic} onChange={e=>setVitals({...vitals,diastolic:e.target.value})} placeholder="80" required/></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div className="form-group"><label className="form-label">Heart Rate (bpm)</label><input className="form-input" type="number" value={vitals.heartRate} onChange={e=>setVitals({...vitals,heartRate:e.target.value})} placeholder="72" required/></div>
                  <div className="form-group"><label className="form-label">Temperature (°F)</label><input className="form-input" type="number" step="0.1" value={vitals.temperature} onChange={e=>setVitals({...vitals,temperature:e.target.value})} placeholder="98.6" required/></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div className="form-group"><label className="form-label">SpO2 (%)</label><input className="form-input" type="number" value={vitals.spo2} onChange={e=>setVitals({...vitals,spo2:e.target.value})} placeholder="98" required/></div>
                  <div className="form-group"><label className="form-label">Weight (kg)</label><input className="form-input" type="number" step="0.1" value={vitals.weight} onChange={e=>setVitals({...vitals,weight:e.target.value})} placeholder="70"/></div>
                </div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={3} value={vitals.notes} onChange={e=>setVitals({...vitals,notes:e.target.value})} placeholder="Additional observations..."/></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : '💓 Save Vitals'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
