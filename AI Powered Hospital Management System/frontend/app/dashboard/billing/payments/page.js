'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceAPI } from '@/lib/api';

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterMethod, setFilterMethod] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState({ invoiceId: '', amount: '', method: 'Cash', transactionId: '' });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.getAll();
      setInvoices(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  const pendingInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'Partial');
  const todayStr = new Date().toDateString();
  const todayCollections = paidInvoices.reduce((sum, inv) => {
    if (inv.paidAt && new Date(inv.paidAt).toDateString() === todayStr) return sum + (inv.paidAmount || 0);
    return sum;
  }, 0);
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Partial': return 'badge-info';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'UPI': return { class: 'badge-primary', icon: '📱' };
      case 'Card': return { class: 'badge-info', icon: '💳' };
      case 'Cash': return { class: 'badge-success', icon: '💵' };
      case 'Insurance': return { class: 'badge-warning', icon: '🛡️' };
      default: return { class: 'badge-secondary', icon: '💰' };
    }
  };

  async function handleProcessPayment(e) {
    e.preventDefault();
    if (!payment.invoiceId) return;
    try {
      setSaving(true);
      await invoiceAPI.pay(payment.invoiceId, {
        amount: parseFloat(payment.amount),
        method: payment.method,
        transactionId: payment.transactionId || undefined,
      });
      setShowModal(false);
      setPayment({ invoiceId: '', amount: '', method: 'Cash', transactionId: '' });
      fetchInvoices();
    } catch (e) { alert(e.message || 'Payment failed'); }
    finally { setSaving(false); }
  }

  function selectInvoice(id) {
    const inv = pendingInvoices.find(i => i._id === id);
    if (inv) {
      setPayment({ ...payment, invoiceId: id, amount: String((inv.totalAmount || 0) - (inv.paidAmount || 0)) });
    }
  }

  // Filter paid invoices for history table
  let displayPayments = paidInvoices;
  if (filterMethod !== 'All') {
    displayPayments = displayPayments.filter(i => (i.paymentMethod || 'Cash') === filterMethod);
  }
  if (filterDate) {
    displayPayments = displayPayments.filter(i => i.paidAt && new Date(i.paidAt).toLocaleDateString() === new Date(filterDate).toLocaleDateString());
  }
  if (search) {
    displayPayments = displayPayments.filter(i => {
      const q = search.toLowerCase();
      return (i.patientId?.name || '').toLowerCase().includes(q) || (i.invoiceId || '').toLowerCase().includes(q);
    });
  }

  return (
    <DashboardLayout title="Payments" subtitle="Process and track patient payments">
      <div className="page-header" style={{marginBottom:24}}>
        <div><h1 className="page-title">💳 Payments Processing</h1><p className="page-subtitle">Manage collections, process payments, and track transactions</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>💳 Process Payment</button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',marginBottom:24}}>
        <div className="stat-card"><div className="stat-icon" style={{background:'#10b98122'}}><span style={{fontSize:22}}>💰</span></div><div><div className="stat-value" style={{color:'#10b981'}}>₹{todayCollections.toLocaleString('en-IN')}</div><div className="stat-label">Today's Collections</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#f59e0b22'}}><span style={{fontSize:22}}>⏳</span></div><div><div className="stat-value" style={{color:'#f59e0b'}}>₹{pendingAmount.toLocaleString('en-IN')}</div><div className="stat-label">Pending Payments</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#6366f122'}}><span style={{fontSize:22}}>📱</span></div><div><div className="stat-value" style={{color:'#6366f1'}}>{paidInvoices.filter(i=>(i.paymentMethod||'')==='UPI').length}</div><div className="stat-label">UPI Payments</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background:'#0ea5e922'}}><span style={{fontSize:22}}>💳</span></div><div><div className="stat-value" style={{color:'#0ea5e9'}}>{paidInvoices.filter(i=>(i.paymentMethod||'')==='Card').length}</div><div className="stat-label">Card Payments</div></div></div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4" style={{marginBottom:20,flexWrap:'wrap'}}>
        <div className="search-bar" style={{flex:1,maxWidth:300}}>
          <span style={{marginRight:8}}>🔍</span>
          <input className="form-input" placeholder="Search by patient or invoice..." value={search} onChange={e => setSearch(e.target.value)} style={{border:'none',background:'transparent',flex:1,outline:'none',color:'inherit'}} />
        </div>
        <select className="form-select" value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={{maxWidth:160}}>
          <option value="All">All Methods</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Cash">Cash</option>
          <option value="Insurance">Insurance</option>
        </select>
        <input className="form-input" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{maxWidth:180}} />
      </div>

      {/* Payment History Table */}
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">💳 Payment History</div><div className="card-subtitle">Completed payment transactions</div></div>
          <span className="badge badge-secondary">{displayPayments.length} records</span>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Invoice ID</th><th>Patient</th><th>Amount</th><th>Method</th><th>Transaction ID</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i}>{[1,2,3,4,5,6,7].map(j=><td key={j}><div className="skeleton" style={{height:14,width:'80%'}}/></td>)}</tr>)
              ) : displayPayments.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-title">No payment records found</div></div></td></tr>
              ) : (
                displayPayments.slice(0, 20).map((inv, idx) => {
                  const mb = getMethodBadge(inv.paymentMethod || 'Cash');
                  return (
                    <tr key={inv._id || idx}>
                      <td className="font-semibold text-sm">{inv.invoiceId || '—'}</td>
                      <td>
                        <div className="text-sm">{inv.patientId?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted">{inv.patientId?.phone || ''}</div>
                      </td>
                      <td className="font-semibold" style={{color:'#10b981'}}>₹{(inv.paidAmount || inv.totalAmount || 0).toFixed(2)}</td>
                      <td><span className={`badge ${mb.class}`} style={{fontSize:'0.7rem'}}>{mb.icon} {inv.paymentMethod || 'Cash'}</span></td>
                      <td className="text-xs text-muted">{inv.transactionId || '—'}</td>
                      <td className="text-xs text-muted">{inv.paidAt ? new Date(inv.paidAt).toLocaleString() : '—'}</td>
                      <td><span className={`badge ${getStatusBadge(inv.status)}`} style={{fontSize:'0.7rem'}}>{inv.status}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Payment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:480}}>
            <div className="modal-header">
              <h3 className="modal-title">💳 Process Payment</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleProcessPayment}>
              <div style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
                <div className="form-group">
                  <label className="form-label">Select Invoice</label>
                  <select className="form-select" value={payment.invoiceId} onChange={e => { setPayment({...payment, invoiceId: e.target.value}); selectInvoice(e.target.value); }} required>
                    <option value="">— Select pending invoice —</option>
                    {pendingInvoices.map(inv => (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceId} — {inv.patientId?.name || 'Patient'} — ₹{((inv.totalAmount || 0) - (inv.paidAmount || 0)).toFixed(2)} due
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Amount (₹)</label><input className="form-input" type="number" step="0.01" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})} placeholder="0.00" required/></div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={payment.method} onChange={e=>setPayment({...payment,method:e.target.value})}>
                    <option value="Cash">💵 Cash</option>
                    <option value="UPI">📱 UPI</option>
                    <option value="Card">💳 Card</option>
                    <option value="Insurance">🛡️ Insurance</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Transaction ID (optional)</label><input className="form-input" value={payment.transactionId} onChange={e=>setPayment({...payment,transactionId:e.target.value})} placeholder="e.g. TXN12345678"/></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Processing...' : '💳 Process Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
