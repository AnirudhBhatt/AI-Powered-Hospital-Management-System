'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  function handleAction(action) {
    setMaintenanceMsg(`${action} initiated successfully!`);
    setTimeout(() => setMaintenanceMsg(''), 3000);
  }

  return (
    <DashboardLayout title="System Settings" subtitle="Configure system parameters and preferences">
      {/* Page Header */}
      <div className="page-header" style={{marginBottom:24}}>
        <div><h1 className="page-title">⚙️ System Settings</h1><p className="page-subtitle">View and manage system configuration</p></div>
      </div>

      {maintenanceMsg && (
        <div style={{background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:12,padding:'12px 20px',marginBottom:20,color:'#6ee7b7',display:'flex',alignItems:'center',gap:8}}>
          <span>✅</span><span>{maintenanceMsg}</span>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(400px,1fr))',gap:20}}>
        {/* System Information */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">🖥️ System Information</div><div className="card-subtitle">Current system configuration</div></div></div>
          <div style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:16}}>
            {[
              { label: 'Application Version', value: 'v2.4.1', icon: '📦' },
              { label: 'Environment', value: 'Production', icon: '🌐', badge: 'badge-success' },
              { label: 'MongoDB Status', value: 'Connected', icon: '🍃', badge: 'badge-success' },
              { label: 'Server Port', value: '5000', icon: '🔌' },
              { label: 'Node.js Version', value: 'v20.11.0', icon: '💚' },
              { label: 'Last Updated', value: new Date().toLocaleDateString(), icon: '📅' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between" style={{padding:'8px 0',borderBottom:i<5?'1px solid var(--border)':'none'}}>
                <span className="text-sm" style={{color:'var(--text-muted)'}}>{item.icon} {item.label}</span>
                <span className="text-sm font-semibold">
                  {item.badge ? <span className={`badge ${item.badge}`} style={{fontSize:'0.75rem'}}>{item.value}</span> : item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">🔒 Security Settings</div><div className="card-subtitle">Authentication and security parameters</div></div></div>
          <div style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:16}}>
            {[
              { label: 'JWT Token Expiry', value: '24 hours', icon: '🔑' },
              { label: 'Refresh Token Expiry', value: '7 days', icon: '🔄' },
              { label: 'Rate Limiting', value: '100 req/15min', icon: '🛡️' },
              { label: 'Password Policy', value: 'Min 6 chars', icon: '🔐' },
              { label: 'Session Timeout', value: '30 minutes', icon: '⏰' },
              { label: 'CORS Origin', value: 'localhost:3000', icon: '🌍' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between" style={{padding:'8px 0',borderBottom:i<5?'1px solid var(--border)':'none'}}>
                <span className="text-sm" style={{color:'var(--text-muted)'}}>{item.icon} {item.label}</span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">🔔 Notification Settings</div><div className="card-subtitle">Manage notification preferences</div></div></div>
          <div style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:20}}>
            {[
              { label: 'Email Notifications', desc: 'Receive system alerts via email', state: emailNotif, setter: setEmailNotif, icon: '📧' },
              { label: 'SMS Notifications', desc: 'Receive critical alerts via SMS', state: smsNotif, setter: setSmsNotif, icon: '💬' },
              { label: 'Push Notifications', desc: 'Browser push notifications', state: pushNotif, setter: setPushNotif, icon: '📱' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{item.icon} {item.label}</div>
                  <div className="text-xs text-muted">{item.desc}</div>
                </div>
                <button
                  onClick={() => item.setter(!item.state)}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: item.state ? '#10b981' : 'var(--border)',
                    position: 'relative', transition: 'background 0.3s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 3,
                    left: item.state ? 25 : 3, transition: 'left 0.3s',
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">🔧 Maintenance</div><div className="card-subtitle">System maintenance operations</div></div></div>
          <div style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:12}}>
            <button className="btn btn-secondary" onClick={() => handleAction('Cache cleared')} style={{justifyContent:'flex-start'}}>
              🗑️ Clear Application Cache
            </button>
            <button className="btn btn-secondary" onClick={() => handleAction('Database backup')} style={{justifyContent:'flex-start'}}>
              💾 Database Backup
            </button>
            <button className="btn btn-secondary" onClick={() => handleAction('Health check passed')} style={{justifyContent:'flex-start'}}>
              🩺 System Health Check
            </button>
            <button className="btn btn-secondary" onClick={() => handleAction('Logs rotated')} style={{justifyContent:'flex-start'}}>
              📋 Rotate System Logs
            </button>
          </div>
          <div style={{padding:'0 24px 24px'}}>
            <div style={{background:'var(--bg-secondary)',borderRadius:8,padding:12}}>
              <div className="text-xs text-muted" style={{marginBottom:4}}>System Status</div>
              <div className="flex items-center gap-2">
                <div style={{width:8,height:8,borderRadius:'50%',background:'#10b981'}} />
                <span className="text-sm font-semibold" style={{color:'#10b981'}}>All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
