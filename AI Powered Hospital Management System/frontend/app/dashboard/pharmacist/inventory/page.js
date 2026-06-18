'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { medicineAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const CATEGORIES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream',
  'Drops',
  'Inhaler',
  'Other'
];

const EMPTY_FORM = {
  name: '',
  genericName: '',
  category: 'Tablet',
  manufacturer: '',
  supplier: '',
  stock: 0,
  minStock: 50,
  unit: 'units',
  price: 0,
  expiryDate: '',
  batchNumber: '',
  description: ''
};

export default function InventoryPage() {
  const { user } = useAuth();
  
  // State for data
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal State (Add/Edit)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Stock Update Modal State
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({ quantity: 1, action: 'add' });
  const [selectedStockMedicine, setSelectedStockMedicine] = useState(null);
  const [updatingStock, setUpdatingStock] = useState(false);

  // Fetch medicines from API
  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (lowStockOnly) params.append('lowStock', 'true');
      
      const res = await medicineAPI.getAll(params.toString());
      setMedicines(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, lowStockOnly]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Form field handlers
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setModalMode('add');
    setEditingId(null);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (med) => {
    setForm({
      name: med.name || '',
      genericName: med.genericName || '',
      category: med.category || 'Tablet',
      manufacturer: med.manufacturer || '',
      supplier: med.supplier || '',
      stock: med.stock || 0,
      minStock: med.minStock || 50,
      unit: med.unit || 'units',
      price: med.price || 0,
      expiryDate: med.expiryDate ? med.expiryDate.split('T')[0] : '',
      batchNumber: med.batchNumber || '',
      description: med.description || ''
    });
    setModalMode('edit');
    setEditingId(med._id);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  // Add / Edit submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (modalMode === 'add') {
        await medicineAPI.create(form);
        setSuccess('Medicine added successfully!');
      } else {
        await medicineAPI.update(editingId, form);
        setSuccess('Medicine updated successfully!');
      }
      setShowModal(false);
      fetchMedicines();
    } catch (err) {
      setError(err.message || 'Failed to save medicine');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setError('');
    setSuccess('');
    try {
      await medicineAPI.delete(id);
      setSuccess('Medicine deleted successfully!');
      fetchMedicines();
    } catch (err) {
      setError(err.message || 'Failed to delete medicine');
    }
  };

  // Stock update handlers
  const openStockModal = (med) => {
    setSelectedStockMedicine(med);
    setStockForm({ quantity: 10, action: 'add' });
    setError('');
    setSuccess('');
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setUpdatingStock(true);
    setError('');
    setSuccess('');
    try {
      await medicineAPI.updateStock(selectedStockMedicine._id, {
        quantity: Number(stockForm.quantity),
        action: stockForm.action
      });
      setSuccess(`Stock updated successfully for ${selectedStockMedicine.name}!`);
      setShowStockModal(false);
      fetchMedicines();
    } catch (err) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setUpdatingStock(false);
    }
  };

  // Helper: check if stock is low
  const isStockLow = (stock, minStock) => {
    return stock <= minStock;
  };

  // Helper: check if expiring within 30 days
  const isExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setLowStockOnly(false);
  };

  // Filter client-side additionally if needed, or rely on API
  const filteredMedicines = medicines.filter(med => {
    if (lowStockOnly && med.stock >= med.minStock) return false;
    return true;
  });

  return (
    <DashboardLayout title="Medicine Inventory" subtitle="Manage medicine items and stock levels">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Medicine Inventory</h1>
          <p className="page-subtitle">
            {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          ➕ Add Medicine
        </button>
      </div>

      {/* Alert banners */}
      {error && (
        <div className="alert-emergency">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert-emergency" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' }}>
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-bar">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by medicine or generic name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label className="flex items-center gap-2" style={{ cursor: 'pointer', padding: '0 8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          Low Stock Only (Stock &lt; Min Stock)
        </label>

        {(searchQuery || selectedCategory || lowStockOnly) && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: '48px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💊</div>
            <div className="empty-state-title">No medicines found</div>
            <p className="text-muted text-sm">Try clearing filters or adding a new medicine to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Generic Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Price</th>
                  <th>Expiry Date</th>
                  <th>Supplier</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((med) => {
                  const low = isStockLow(med.stock, med.minStock);
                  const expiring = isExpiringSoon(med.expiryDate);
                  
                  return (
                    <tr key={med._id}>
                      <td>
                        <div className="font-semibold">{med.name}</div>
                        <div className="text-xs text-muted">Batch: {med.batchNumber || '—'}</div>
                      </td>
                      <td>{med.genericName || '—'}</td>
                      <td>
                        <span className="badge badge-secondary">{med.category}</span>
                      </td>
                      <td className={low ? 'text-danger font-bold' : ''}>
                        {med.stock} {med.unit}
                        {low && <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>⚠️</span>}
                      </td>
                      <td>{med.minStock} {med.unit}</td>
                      <td className="font-semibold">₹{med.price.toFixed(2)}</td>
                      <td className={expiring ? 'text-danger font-bold' : ''}>
                        {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN') : '—'}
                        {expiring && <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>⌛</span>}
                      </td>
                      <td>{med.supplier || '—'}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => openStockModal(med)}
                            title="Update Stock"
                          >
                            📦 Stock
                          </button>
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => openEditModal(med)}
                            title="Edit Medicine"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDelete(med._id, med.name)}
                            title="Delete Medicine"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Medicine Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' ? '➕ Add Medicine' : '✏️ Edit Medicine'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Medicine Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Paracetamol"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Generic Name</label>
                  <input
                    type="text"
                    name="genericName"
                    className="form-input"
                    value={form.genericName}
                    onChange={handleInputChange}
                    placeholder="e.g. Acetaminophen"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    className="form-select"
                    value={form.category}
                    onChange={handleInputChange}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    className="form-input"
                    value={form.manufacturer}
                    onChange={handleInputChange}
                    placeholder="e.g. Cipla"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    className="form-input"
                    value={form.supplier}
                    onChange={handleInputChange}
                    placeholder="e.g. MedLink Pharma"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    className="form-input"
                    value={form.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Stock *</label>
                  <input
                    type="number"
                    name="minStock"
                    className="form-input"
                    value={form.minStock}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <input
                    type="text"
                    name="unit"
                    className="form-input"
                    value={form.unit}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. tablets, vials"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    className="form-input"
                    value={form.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    className="form-input"
                    value={form.expiryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    className="form-input"
                    value={form.batchNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. BAT1298"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Remarks</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Additional storage notes, shelf location (e.g. Shelf A-3), etc."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showStockModal && selectedStockMedicine && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowStockModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📦 Update Stock</h3>
              <button className="modal-close" onClick={() => setShowStockModal(false)}>✕</button>
            </div>
            <form onSubmit={handleStockSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <span className="font-semibold">{selectedStockMedicine.name}</span>
                <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                  Current Stock: {selectedStockMedicine.stock} {selectedStockMedicine.unit}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Action</label>
                <select
                  className="form-select"
                  value={stockForm.action}
                  onChange={(e) => setStockForm(prev => ({ ...prev, action: e.target.value }))}
                >
                  <option value="add">➕ Restock (Add)</option>
                  <option value="subtract">➖ Dispense (Subtract)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  min="1"
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowStockModal(false)}
                  disabled={updatingStock}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingStock}
                >
                  {updatingStock ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
