'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { appointmentAPI, patientAPI, doctorAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Gynaecology'
];

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM'
];

export default function ReceptionistAppointmentManagement() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table Filters state
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');

  // Book Modal state
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Reschedule Modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [apptsRes, patientsRes, doctorsRes] = await Promise.all([
        appointmentAPI.getAll(),
        patientAPI.getAll(),
        doctorAPI.getAll()
      ]);
      setAppointments(apptsRes.data || []);
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch appointment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    
    // Automatically trigger booking modal if URL parameter book=true is present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('book') === 'true') {
        setBookModalOpen(true);
      }
    }
  }, []);

  // Filtered doctors for dropdown by department
  const filteredDoctorsForModal = doctors.filter((doc) => {
    if (!selectedDept) return true;
    return doc.department === selectedDept;
  });

  // Handle book appointment submit
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || !selectedDept || !selectedDate || !selectedSlot) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        department: selectedDept,
        date: new Date(selectedDate).toISOString(),
        timeSlot: selectedSlot,
        symptoms
      };

      await appointmentAPI.create(payload);
      setBookModalOpen(false);
      
      // Reset form
      setSelectedPatientId('');
      setSelectedDept('');
      setSelectedDoctorId('');
      setSelectedDate('');
      setSelectedSlot('');
      setSymptoms('');
      setPatientSearch('');
      
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to create appointment.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Confirm appointment
  const handleConfirm = async (id) => {
    try {
      await appointmentAPI.updateStatus(id, { status: 'Confirmed' });
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to confirm appointment.');
    }
  };

  // Cancel appointment
  const handleCancel = async (id) => {
    const reason = prompt('Please enter cancellation reason (optional):') || 'Cancelled by reception';
    try {
      await appointmentAPI.updateStatus(id, { status: 'Cancelled', cancelReason: reason });
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  // Open reschedule modal
  const handleOpenReschedule = (appt) => {
    setRescheduleAppt(appt);
    setNewDate(appt.date ? new Date(appt.date).toISOString().split('T')[0] : '');
    setNewSlot(appt.timeSlot || '');
    setRescheduleModalOpen(true);
  };

  // Reschedule submission (cancels old appointment and creates a new one)
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleAppt || !newDate || !newSlot) return;

    try {
      setSubmitLoading(true);

      // Cancel original
      await appointmentAPI.updateStatus(rescheduleAppt._id, {
        status: 'Cancelled',
        cancelReason: 'Rescheduled to new date/time'
      });

      // Create new appointment
      const payload = {
        patientId: rescheduleAppt.patientId?._id || rescheduleAppt.patientId,
        doctorId: rescheduleAppt.doctorId?._id || rescheduleAppt.doctorId,
        department: rescheduleAppt.department,
        date: new Date(newDate).toISOString(),
        timeSlot: newSlot,
        symptoms: rescheduleAppt.symptoms || 'Rescheduled appointment'
      };

      await appointmentAPI.create(payload);
      setRescheduleModalOpen(false);
      setRescheduleAppt(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to reschedule appointment.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter patient list based on search term in book modal
  const filteredPatientsForModal = patients.filter((p) =>
    (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.patientId || '').toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Main table appointments filtering
  const filteredAppointments = appointments.filter((appt) => {
    // Date check
    if (filterDate) {
      const apptDateStr = appt.date ? new Date(appt.date).toISOString().split('T')[0] : '';
      if (apptDateStr !== filterDate) return false;
    }
    // Status check
    if (filterStatus && appt.status !== filterStatus) return false;
    // Doctor check
    if (filterDoctor && appt.doctorId?._id !== filterDoctor) return false;
    
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Requested':
        return 'badge-warning';
      case 'Confirmed':
        return 'badge-info';
      case 'In Consultation':
        return 'badge-primary';
      case 'Completed':
        return 'badge-success';
      case 'Cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <DashboardLayout title="Appointment Management" subtitle="Manage, confirm, reschedule and book patient appointments">
      {loading && appointments.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="loading-spinner" />
        </div>
      ) : error ? (
        <div className="alert-emergency">{error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Controls & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="filters-bar" style={{ margin: 0 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="date"
                  className="form-input"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ width: '160px' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Requested">Requested</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Consultation">In Consultation</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <select
                  className="form-select"
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  style={{ width: '200px' }}
                >
                  <option value="">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>

              {(filterDate || filterStatus || filterDoctor) && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setFilterDate('');
                    setFilterStatus('');
                    setFilterDoctor('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setBookModalOpen(true)}
            >
              📅 Book Appointment
            </button>
          </div>

          {/* Appointments Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Patient Name</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center' }}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📅</div>
                          <div className="empty-state-title">No appointments found</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appt) => (
                      <tr key={appt._id}>
                        <td className="text-muted text-xs">
                          {appt.appointmentId || appt._id?.slice(-8).toUpperCase() || '—'}
                        </td>
                        <td className="font-semibold">{appt.patientId?.name || 'Walk-in / Unknown'}</td>
                        <td className="text-sm">
                          {appt.doctorId?.name ? `Dr. ${appt.doctorId.name}` : '—'}
                        </td>
                        <td>
                          <span className="badge badge-secondary">{appt.department || '—'}</span>
                        </td>
                        <td className="text-sm">
                          {appt.date ? new Date(appt.date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="text-sm">{appt.timeSlot || '—'}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(appt.status)}`}>
                            {appt.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {appt.status === 'Requested' && (
                              <button
                                className="btn btn-success btn-xs"
                                onClick={() => handleConfirm(appt._id)}
                              >
                                Confirm
                              </button>
                            )}
                            {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                              <>
                                <button
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => handleOpenReschedule(appt)}
                                >
                                  Reschedule
                                </button>
                                <button
                                  className="btn btn-danger btn-xs"
                                  onClick={() => handleCancel(appt._id)}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {bookModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setBookModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Book Patient Appointment</h3>
              <button className="modal-close" onClick={() => setBookModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleBookAppointment}>
              {/* Patient Selector Section */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Search & Select Patient</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type to search patients by name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                
                {patientSearch && (
                  <div 
                    style={{ 
                      maxHeight: '120px', 
                      overflowY: 'auto', 
                      background: 'var(--bg-elevated)', 
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '4px'
                    }}
                  >
                    {filteredPatientsForModal.length === 0 ? (
                      <div className="text-muted text-xs" style={{ padding: '8px' }}>No patients found. Register them first.</div>
                    ) : (
                      filteredPatientsForModal.map((pat) => (
                        <div
                          key={pat._id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            background: selectedPatientId === pat._id ? 'var(--primary)' : 'transparent',
                            color: selectedPatientId === pat._id ? 'white' : 'var(--text-primary)'
                          }}
                          onClick={() => {
                            setSelectedPatientId(pat._id);
                            setPatientSearch(pat.name);
                          }}
                        >
                          {pat.name} ({pat.bloodGroup || 'No Blood Group'} - {pat.phone})
                        </div>
                      ))
                    )}
                  </div>
                )}
                {selectedPatientId && !patientSearch && (
                  <div className="text-xs text-success" style={{ marginTop: '4px' }}>
                    Selected Patient: <strong>{patients.find(p => p._id === selectedPatientId)?.name}</strong>
                  </div>
                )}
              </div>

              {/* Department Dropdown */}
              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setSelectedDoctorId(''); // reset doctor selection
                    }}
                    required
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Doctor Dropdown */}
                <div className="form-group">
                  <label className="form-label">Doctor</label>
                  <select
                    className="form-select"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    disabled={!selectedDept}
                  >
                    <option value="">Select Doctor</option>
                    {filteredDoctorsForModal.map((doc) => (
                      <option key={doc._id} value={doc._id}>Dr. {doc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time slot */}
              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <select
                    className="form-select"
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    required
                  >
                    <option value="">Select Slot</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Symptoms */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Symptoms / Reason for visit</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter patient symptoms or reason for scheduling..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBookModalOpen(false)}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && rescheduleAppt && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setRescheduleModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reschedule Appointment</h3>
              <button className="modal-close" onClick={() => setRescheduleModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleRescheduleSubmit}>
              <div style={{ marginBottom: '16px', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Patient</div>
                <div className="font-semibold" style={{ fontSize: '1rem', marginBottom: '8px' }}>
                  {rescheduleAppt.patientId?.name || 'Walk-in / Unknown'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Doctor & Department</div>
                <div className="font-semibold" style={{ fontSize: '0.95rem' }}>
                  {rescheduleAppt.doctorId?.name ? `Dr. ${rescheduleAppt.doctorId.name}` : '—'} ({rescheduleAppt.department})
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">New Date</label>
                <input
                  type="date"
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">New Time Slot</label>
                <select
                  className="form-select"
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  required
                >
                  <option value="">Select Slot</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRescheduleModalOpen(false)}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
