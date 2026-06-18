'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { roomAPI, patientAPI, doctorAPI, userAPI } from '@/lib/api';

const WARDS = ['General', 'ICU', 'Emergency', 'Maternity', 'Pediatric', 'Surgical', 'Neurology', 'Cardiology'];
const ROOM_TYPES = ['Single', 'Double', 'Suite', 'ICU Bed', 'General Ward Bed'];

const EMPTY_ADMIT_FORM = {
  roomId: '',
  patientId: '',
  doctorId: '',
  nurseId: '',
  reason: '',
};

const EMPTY_ROOM_FORM = {
  roomNumber: '',
  ward: 'General',
  type: 'Single',
  capacity: '1',
};

export default function RoomsManagementPage() {
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  
  // Forms
  const [admitForm, setAdmitForm] = useState(EMPTY_ADMIT_FORM);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM_FORM);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch Rooms
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomAPI.getAll();
      const roomsData = res.data || [];
      setRooms(roomsData);
      
      // Update selected room details if one is selected
      if (selectedRoom) {
        const updated = roomsData.find(r => r._id === selectedRoom._id || r.id === selectedRoom.id);
        setSelectedRoom(updated || null);
      }
    } catch (e) {
      console.error('Failed to fetch rooms', e);
      setError('Could not retrieve inpatient room details.');
    } finally {
      setLoading(false);
    }
  }, [selectedRoom]);

  // Fetch auxiliary data (patients, doctors, nurses) for modal selectors
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [patientsRes, doctorsRes, usersRes] = await Promise.all([
        patientAPI.getAll('limit=100'),
        doctorAPI.getAll('limit=100'),
        userAPI.getAll('limit=200'),
      ]);
      
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
      
      // Filter users to get nurses
      const allUsers = usersRes.data || [];
      const nursesOnly = allUsers.filter(u => u.role === 'nurse');
      setNurses(nursesOnly);
    } catch (e) {
      console.error('Error fetching auxiliary data', e);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchAuxiliaryData();
  }, []);

  // Stats calculation
  let totalRooms = rooms.length;
  let totalBeds = 0;
  let occupiedBeds = 0;

  rooms.forEach(room => {
    if (room.beds && Array.isArray(room.beds) && room.beds.length > 0) {
      totalBeds += room.beds.length;
      occupiedBeds += room.beds.filter(b => b.isOccupied || b.occupied || b.patientId || b.patient).length;
    } else {
      totalBeds += Number(room.capacity || 1);
      const isRoomOccupied = room.isOccupied || room.occupied || room.status === 'occupied' || room.patientId || room.patient;
      if (isRoomOccupied) {
        occupiedBeds += 1;
      }
    }
  });

  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Admit submit
  const handleAdmitSubmit = async e => {
    e.preventDefault();
    if (!admitForm.roomId || !admitForm.patientId) {
      setError('Please select both a room and a patient.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        patientId: admitForm.patientId,
        patient: admitForm.patientId,
        doctorId: admitForm.doctorId || undefined,
        doctor: admitForm.doctorId || undefined,
        nurseId: admitForm.nurseId || undefined,
        nurse: admitForm.nurseId || undefined,
        reason: admitForm.reason || 'General Admission',
      };
      
      await roomAPI.admit(admitForm.roomId, payload);
      setSuccess('Patient admitted and room status updated successfully!');
      setShowAdmitModal(false);
      setAdmitForm(EMPTY_ADMIT_FORM);
      fetchRooms();
    } catch (e) {
      setError(e.message || 'Failed to admit patient. The room/bed might be occupied.');
    } finally {
      setSubmitting(false);
    }
  };

  // Discharge patient
  const handleDischarge = async (roomId, roomNumber) => {
    if (!window.confirm(`Are you sure you want to discharge the patient from Room ${roomNumber}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await roomAPI.discharge(roomId);
      setSuccess(`Discharged patient from Room ${roomNumber} successfully.`);
      fetchRooms();
    } catch (e) {
      setError(e.message || `Failed to discharge patient from Room ${roomNumber}.`);
    } finally {
      setLoading(false);
    }
  };

  // Create room
  const handleCreateRoomSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await roomAPI.create({
        roomNumber: roomForm.roomNumber,
        ward: roomForm.ward,
        type: roomForm.type,
        capacity: Number(roomForm.capacity),
      });

      setSuccess(`Room ${roomForm.roomNumber} created successfully.`);
      setShowRoomModal(false);
      setRoomForm(EMPTY_ROOM_FORM);
      fetchRooms();
    } catch (e) {
      setError(e.message || 'Failed to create room. Room number may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOccupancyStatusLabel = room => {
    const hasBeds = room.beds && Array.isArray(room.beds) && room.beds.length > 0;
    
    if (hasBeds) {
      const occupiedCount = room.beds.filter(b => b.isOccupied || b.occupied || b.patientId || b.patient).length;
      if (occupiedCount === 0) {
        return <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>● Available</span>;
      }
      if (occupiedCount >= room.beds.length) {
        return <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>● Occupied</span>;
      }
      return (
        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
          ● {occupiedCount}/{room.beds.length} Occupied
        </span>
      );
    } else {
      const isOccupied = room.isOccupied || room.occupied || room.status === 'occupied' || room.patientId || room.patient;
      return isOccupied ? (
        <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>● Occupied</span>
      ) : (
        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>● Available</span>
      );
    }
  };

  const isRoomFull = room => {
    const hasBeds = room.beds && Array.isArray(room.beds) && room.beds.length > 0;
    if (hasBeds) {
      const occupiedCount = room.beds.filter(b => b.isOccupied || b.occupied || b.patientId || b.patient).length;
      return occupiedCount >= room.beds.length;
    }
    return room.isOccupied || room.occupied || room.status === 'occupied' || room.patientId || room.patient;
  };

  const isRoomAnyOccupied = room => {
    const hasBeds = room.beds && Array.isArray(room.beds) && room.beds.length > 0;
    if (hasBeds) {
      return room.beds.some(b => b.isOccupied || b.occupied || b.patientId || b.patient);
    }
    return room.isOccupied || room.occupied || room.status === 'occupied' || room.patientId || room.patient;
  };

  return (
    <DashboardLayout title="Room & Bed Management" subtitle="Manage inpatient room allocation, patient admissions and discharges">
      
      {/* Stats Bar */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent-color': 'var(--primary)' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>🏢</div>
          <div>
            <div className="stat-value">{totalRooms}</div>
            <div className="stat-label">Total Rooms</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--danger)' }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>🛏️</div>
          <div>
            <div className="stat-value">{occupiedBeds}</div>
            <div className="stat-label">Occupied Beds</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent)' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)' }}>✨</div>
          <div>
            <div className="stat-value">{availableBeds}</div>
            <div className="stat-label">Available Beds</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--warning)' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>📊</div>
          <div>
            <div className="stat-value">{occupancyRate}%</div>
            <div className="stat-label">Occupancy Rate</div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">🛏️ Inpatient Wards</h2>
          <p className="page-subtitle">Real-time room occupancy and admission management</p>
        </div>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setShowRoomModal(true);
              setError('');
              setSuccess('');
            }}
          >
            🏢 Create Room
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setShowAdmitModal(true);
              setError('');
              setSuccess('');
            }}
          >
            ➕ Admit Patient
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="alert-emergency" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', marginBottom: 16 }}>
          <span>✅</span>
          <span className="text-sm">{success}</span>
        </div>
      )}

      {error && !showAdmitModal && !showRoomModal && (
        <div className="alert-emergency" style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', marginBottom: 16 }}>
          <span>⚠️</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Two-Column Room Layout */}
      <div className="flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Left Side: Room Cards Grid */}
        <div style={{ flex: '1 1 600px', minWidth: '320px' }}>
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {loading && rooms.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card skeleton" style={{ height: 160 }} />
              ))
            ) : rooms.length === 0 ? (
              <div className="card w-full" style={{ gridColumn: '1 / -1', padding: '48px 24px' }}>
                <div className="empty-state">
                  <div className="empty-state-icon">🛏️</div>
                  <div className="empty-state-title">No Rooms Found</div>
                  <p className="text-sm text-muted">Create rooms or wards to start managing admissions.</p>
                </div>
              </div>
            ) : (
              rooms.map(room => {
                const isSelected = selectedRoom && (selectedRoom._id === room._id || selectedRoom.id === room.id);
                return (
                  <div 
                    key={room._id || room.id}
                    className="card"
                    onClick={() => setSelectedRoom(room)}
                    style={{ 
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                      background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                      <span className="font-bold text-sm" style={{ color: 'var(--primary-light)' }}>
                        Room {room.roomNumber}
                      </span>
                      {getOccupancyStatusLabel(room)}
                    </div>
                    
                    <div className="text-xs text-muted" style={{ marginBottom: 8 }}>
                      Ward: <strong style={{ color: 'var(--text-primary)' }}>{room.ward}</strong>
                    </div>
                    <div className="text-xs text-muted" style={{ marginBottom: 12 }}>
                      Type: <strong style={{ color: 'var(--text-primary)' }}>{room.type}</strong>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <span className="text-xs text-muted">
                        Capacity: {room.capacity || (room.beds?.length || 1)} beds
                      </span>
                      {isRoomAnyOccupied(room) && !room.beds?.length && (
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDischarge(room._id || room.id, room.roomNumber);
                          }}
                        >
                          🚪 Discharge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected Room Beds & Details Panel */}
        {selectedRoom && (
          <div className="card" style={{ flex: '0 0 380px', minWidth: '300px', position: 'sticky', top: '88px', border: '1px solid var(--primary-light)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.2rem' }}>🚪 Room {selectedRoom.roomNumber} Details</h3>
                <span className="badge badge-secondary" style={{ fontSize: '0.65rem', marginTop: 4 }}>
                  {selectedRoom.ward} Ward — {selectedRoom.type}
                </span>
              </div>
              <button 
                className="btn btn-ghost btn-icon" 
                style={{ width: 24, height: 24, fontSize: '0.8rem' }}
                onClick={() => setSelectedRoom(null)}
              >
                ✕
              </button>
            </div>

            {/* Beds List in Selected Room */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beds Allocation</h4>
              
              {selectedRoom.beds && Array.isArray(selectedRoom.beds) && selectedRoom.beds.length > 0 ? (
                selectedRoom.beds.map((bed, idx) => {
                  const isBedOccupied = bed.isOccupied || bed.occupied || bed.patientId || bed.patient;
                  const patientInfo = bed.patient || bed.patientId;
                  const doctorInfo = bed.doctor || bed.doctorId;
                  const nurseInfo = bed.nurse || bed.nurseId;

                  return (
                    <div key={idx} className="card" style={{ padding: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                        <span className="font-semibold text-xs text-primary">🛏️ Bed {bed.bedNumber || `${selectedRoom.roomNumber}-${idx + 1}`}</span>
                        <span className={`badge ${isBedOccupied ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                          {isBedOccupied ? 'Occupied' : 'Available'}
                        </span>
                      </div>
                      
                      {isBedOccupied ? (
                        <div className="text-xs" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                          <div>Patient: <strong>{patientInfo?.name || patientInfo?.user?.name || patientInfo || 'Anonymous'}</strong></div>
                          {doctorInfo && <div>Doctor: <span className="text-muted">{doctorInfo?.name || doctorInfo?.user?.name || doctorInfo}</span></div>}
                          {nurseInfo && <div>Nurse: <span className="text-muted">{nurseInfo?.name || nurseInfo?.user?.name || nurseInfo}</span></div>}
                          {bed.admittedAt && <div className="text-muted">Admitted: {new Date(bed.admittedAt).toLocaleDateString()}</div>}
                        </div>
                      ) : (
                        <div className="text-xs text-muted" style={{ marginTop: 4 }}>Vacant and clean. Ready for admission.</div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Handle Room directly as a single Bed if beds array doesn't exist */
                <div className="card" style={{ padding: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                    <span className="font-semibold text-xs text-primary">🛏️ Bed 1 (Single)</span>
                    <span className={`badge ${isRoomFull(selectedRoom) ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                      {isRoomFull(selectedRoom) ? 'Occupied' : 'Available'}
                    </span>
                  </div>
                  
                  {isRoomFull(selectedRoom) ? (
                    <div className="text-xs" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedRoom.patient && (
                        <div>Patient: <strong>{selectedRoom.patientId?.name || selectedRoom.patientId?.user?.name || selectedRoom.patient || 'Active Patient'}</strong></div>
                      )}
                      {selectedRoom.doctor && (
                        <div>Doctor: <span className="text-muted">{selectedRoom.doctorId?.name || selectedRoom.doctorId?.user?.name || selectedRoom.doctor}</span></div>
                      )}
                      {selectedRoom.nurse && (
                        <div>Nurse: <span className="text-muted">{selectedRoom.nurse?.name || selectedRoom.nurse?.user?.name || selectedRoom.nurse}</span></div>
                      )}
                      {selectedRoom.reason && (
                        <div>Reason: <span className="text-muted italic">"{selectedRoom.reason}"</span></div>
                      )}
                      <button
                        className="btn btn-danger btn-sm w-full mt-3"
                        onClick={() => handleDischarge(selectedRoom._id || selectedRoom.id, selectedRoom.roomNumber)}
                      >
                        🚪 Discharge Patient
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted">Vacant. Click "Admit Patient" at the top to allocate this room.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admit Patient Modal */}
      {showAdmitModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdmitModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Admit Patient to Ward</h3>
              <button className="modal-close" onClick={() => setShowAdmitModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAdmitSubmit}>
              {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

              <div className="form-group">
                <label className="form-label">Select Room (Available Rooms Only) *</label>
                <select
                  name="roomId"
                  className="form-select"
                  value={admitForm.roomId}
                  onChange={e => setAdmitForm(f => ({ ...f, roomId: e.target.value }))}
                  required
                >
                  <option value="">-- Choose a vacant room --</option>
                  {rooms
                    .filter(room => !isRoomFull(room))
                    .map(room => (
                      <option key={room._id || room.id} value={room._id || room.id}>
                        Room {room.roomNumber} ({room.ward} - {room.type})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Patient *</label>
                <select
                  name="patientId"
                  className="form-select"
                  value={admitForm.patientId}
                  onChange={e => setAdmitForm(f => ({ ...f, patientId: e.target.value }))}
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => {
                    const name = p.user?.name || p.name || p.email;
                    const id = p._id || p.id;
                    return (
                      <option key={id} value={id}>
                        {name} (ID: {id.slice(-6).toUpperCase()})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Assigned Doctor</label>
                  <select
                    name="doctorId"
                    className="form-select"
                    value={admitForm.doctorId}
                    onChange={e => setAdmitForm(f => ({ ...f, doctorId: e.target.value }))}
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(d => {
                      const name = d.user?.name || d.name;
                      const id = d._id || d.id;
                      return (
                        <option key={id} value={id}>
                          Dr. {name} ({d.specialization})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Nurse</label>
                  <select
                    name="nurseId"
                    className="form-select"
                    value={admitForm.nurseId}
                    onChange={e => setAdmitForm(f => ({ ...f, nurseId: e.target.value }))}
                  >
                    <option value="">-- Select Nurse --</option>
                    {nurses.map(n => {
                      const name = n.name || n.email;
                      const id = n._id || n.id;
                      return (
                        <option key={id} value={id}>
                          {name} ({n.department || 'Nurse'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Admission</label>
                <textarea
                  name="reason"
                  className="form-textarea"
                  value={admitForm.reason}
                  onChange={e => setAdmitForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Clinical symptoms, diagnosis, or ward instructions…"
                  style={{ minHeight: 80 }}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdmitModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Allocating Bed…' : '✅ Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRoomModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">🏢 Create Hospital Room</h3>
              <button className="modal-close" onClick={() => setShowRoomModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateRoomSubmit}>
              {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Room Number *</label>
                  <input
                    name="roomNumber"
                    className="form-input"
                    value={roomForm.roomNumber}
                    onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))}
                    placeholder="e.g. 305"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Beds (Capacity) *</label>
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    value={roomForm.capacity}
                    onChange={e => setRoomForm(f => ({ ...f, capacity: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Ward / Unit *</label>
                  <select
                    name="ward"
                    className="form-select"
                    value={roomForm.ward}
                    onChange={e => setRoomForm(f => ({ ...f, ward: e.target.value }))}
                    required
                  >
                    {WARDS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Room Type *</label>
                  <select
                    name="type"
                    className="form-select"
                    value={roomForm.type}
                    onChange={e => setRoomForm(f => ({ ...f, type: e.target.value }))}
                    required
                  >
                    {ROOM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Creating…' : '✅ Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
