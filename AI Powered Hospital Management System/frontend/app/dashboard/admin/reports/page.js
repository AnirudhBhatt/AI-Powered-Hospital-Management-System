'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { dashboardAPI } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const chartTooltipStyle = {
  contentStyle: { background: '#1e2a4a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#f1f5f9', fontSize: 13 },
  labelStyle: { color: '#94a3b8' },
};

const REVENUE_DATA = [
  { month: 'Jan', revenue: 420000 }, { month: 'Feb', revenue: 580000 },
  { month: 'Mar', revenue: 510000 }, { month: 'Apr', revenue: 690000 },
  { month: 'May', revenue: 750000 }, { month: 'Jun', revenue: 820000 },
  { month: 'Jul', revenue: 780000 }, { month: 'Aug', revenue: 910000 },
  { month: 'Sep', revenue: 850000 }, { month: 'Oct', revenue: 960000 },
  { month: 'Nov', revenue: 1020000 }, { month: 'Dec', revenue: 1150000 },
];

const DEPT_PERFORMANCE = [
  { dept: 'Cardiology', patients: 142, revenue: 320000 },
  { dept: 'Neurology', patients: 98, revenue: 240000 },
  { dept: 'Ortho', patients: 115, revenue: 280000 },
  { dept: 'General', patients: 210, revenue: 180000 },
  { dept: 'Emergency', patients: 185, revenue: 350000 },
  { dept: 'Pediatrics', patients: 130, revenue: 160000 },
];

const PATIENT_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  patients: Math.floor(Math.random() * 40) + 30,
  newAdmissions: Math.floor(Math.random() * 15) + 5,
}));

const BED_OCCUPANCY = [
  { name: 'General Ward', value: 78 },
  { name: 'ICU', value: 92 },
  { name: 'Private Rooms', value: 65 },
  { name: 'Pediatric Ward', value: 54 },
  { name: 'Maternity Ward', value: 71 },
];

const DOCTOR_UTIL = [
  { name: 'Dr. Kumar', utilization: 94 },
  { name: 'Dr. Sharma', utilization: 87 },
  { name: 'Dr. Patel', utilization: 82 },
  { name: 'Dr. Reddy', utilization: 78 },
  { name: 'Dr. Singh', utilization: 91 },
  { name: 'Dr. Iyer', utilization: 73 },
];

const LAB_TESTS = [
  { name: 'Blood Tests', value: 340 },
  { name: 'Urine Tests', value: 180 },
  { name: 'X-Ray', value: 120 },
  { name: 'MRI/CT', value: 85 },
  { name: 'ECG', value: 95 },
  { name: 'Other', value: 60 },
];

const formatCurrency = (v) => {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await dashboardAPI.getStats();
        setStats(res.data || res || {});
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.revenue, 0);

  return (
    <DashboardLayout title="Reports & Analytics" subtitle="Comprehensive hospital performance analytics">
      <div className="page-header" style={{marginBottom:24}}>
        <div><h1 className="page-title">📊 Reports & Analytics</h1><p className="page-subtitle">Comprehensive hospital performance metrics</p></div>
        <div className="flex gap-2">
          {['weekly','monthly','yearly'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',marginBottom:24}}>
        {loading ? (
          [1,2,3,4].map(i=><div key={i} className="stat-card"><div className="skeleton" style={{width:48,height:48,borderRadius:12}}/><div style={{flex:1}}><div className="skeleton" style={{width:'55%',height:28,marginBottom:8}}/><div className="skeleton" style={{width:'75%',height:14}}/></div></div>)
        ) : (<>
          <div className="stat-card"><div className="stat-icon" style={{background:'#10b98122'}}><span style={{fontSize:22}}>💰</span></div><div><div className="stat-value" style={{color:'#10b981'}}>{formatCurrency(totalRevenue)}</div><div className="stat-label">Total Revenue</div><div className="text-xs text-muted" style={{marginTop:4}}>↑ 18% vs last year</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'#6366f122'}}><span style={{fontSize:22}}>🏥</span></div><div><div className="stat-value" style={{color:'#6366f1'}}>{stats.totalPatients || 1248}</div><div className="stat-label">Total Patients</div><div className="text-xs text-muted" style={{marginTop:4}}>↑ 24 this month</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'#f59e0b22'}}><span style={{fontSize:22}}>⏱️</span></div><div><div className="stat-value" style={{color:'#f59e0b'}}>24 min</div><div className="stat-label">Avg Wait Time</div><div className="text-xs text-muted" style={{marginTop:4}}>↓ 6 min improvement</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'#8b5cf622'}}><span style={{fontSize:22}}>🛏️</span></div><div><div className="stat-value" style={{color:'#8b5cf6'}}>{stats.occupancyRate || 76}%</div><div className="stat-label">Bed Occupancy</div><div className="text-xs text-muted" style={{marginTop:4}}>Across all wards</div></div></div>
        </>)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <div className="card-header"><div><div className="card-title">💰 Revenue Trends</div><div className="card-subtitle">Monthly revenue over 12 months</div></div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={REVENUE_DATA} margin={{top:5,right:10,left:0,bottom:5}}>
                <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" />
                <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v=>`₹${(v/100000).toFixed(1)}L`} tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} formatter={v=>[`₹${v.toLocaleString()}`,'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#colorRev)" dot={{fill:'#10b981',r:3}} activeDot={{r:5}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><div className="card-title">🏥 Department Performance</div><div className="card-subtitle">Patient volume by department</div></div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={DEPT_PERFORMANCE} margin={{top:5,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                <XAxis dataKey="dept" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} formatter={v=>[v,'Patients']} />
                <Bar dataKey="patients" fill="#6366f1" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <div className="card-header"><div><div className="card-title">📈 Patient Volume Trends</div><div className="card-subtitle">Daily patient visits - 30 days</div></div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={PATIENT_TREND} margin={{top:5,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.1)" />
                <XAxis dataKey="day" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="patients" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="newAdmissions" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><div className="card-title">🛏️ Bed Occupancy by Ward</div><div className="card-subtitle">Current occupancy rates</div></div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={BED_OCCUPANCY} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {BED_OCCUPANCY.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={v=>[`${v}%`,'Occupancy']} />
                <Legend formatter={v=><span style={{color:'#94a3b8',fontSize:12}}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div><div className="card-title">👨⚕️ Doctor Utilization</div><div className="card-subtitle">Top doctors by patient load</div></div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={DOCTOR_UTIL} layout="vertical" margin={{top:5,right:20,left:60,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" horizontal={false} />
                <XAxis type="number" domain={[0,100]} tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} formatter={v=>[`${v}%`,'Utilization']} />
                <Bar dataKey="utilization" fill="#8b5cf6" radius={[0,6,6,0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><div className="card-title">🔬 Lab Test Distribution</div><div className="card-subtitle">Tests by category</div></div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={LAB_TESTS} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                  {LAB_TESTS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
