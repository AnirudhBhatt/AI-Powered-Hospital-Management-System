const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const api = {
  get: (path) => fetch(`${API_BASE}${path}`, { headers: getHeaders() }).then(handleResponse),
  post: (path, body) => fetch(`${API_BASE}${path}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  put: (path, body) => fetch(`${API_BASE}${path}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  patch: (path, body) => fetch(`${API_BASE}${path}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  delete: (path) => fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  upload: (path, formData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : null;
    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    }).then(handleResponse);
  },
  uploadPatch: (path, formData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : null;
    return fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    }).then(handleResponse);
  },
};

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout', {}),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => api.put('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Patients
export const patientAPI = {
  getAll: (params = '') => api.get(`/patients?${params}`),
  getById: (id) => api.get(`/patients/${id}`),
  getMyProfile: () => api.get('/patients/me/profile'),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  updateHistory: (id, data) => api.patch(`/patients/${id}/medical-history`, data),
};

// Doctors
export const doctorAPI = {
  getAll: (params = '') => api.get(`/doctors?${params}`),
  getById: (id) => api.get(`/doctors/${id}`),
  getMyProfile: () => api.get('/doctors/me/profile'),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  updateSchedule: (id, data) => api.put(`/doctors/${id}/schedule`, data),
  getSlots: (id, date) => api.get(`/doctors/${id}/slots?date=${date}`),
};

// Appointments
export const appointmentAPI = {
  getAll: (params = '') => api.get(`/appointments?${params}`),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  updateStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// Prescriptions
export const prescriptionAPI = {
  getAll: (params = '') => api.get(`/prescriptions?${params}`),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  dispense: (id) => api.patch(`/prescriptions/${id}/dispense`, {}),
};

// Medical Records
export const medicalRecordAPI = {
  getAll: (params = '') => api.get(`/medical-records?${params}`),
  getById: (id) => api.get(`/medical-records/${id}`),
  create: (data) => api.post('/medical-records', data),
  delete: (id) => api.delete(`/medical-records/${id}`),
  upload: (formData) => api.upload('/medical-records', formData),
  download: (id) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : null;
    return fetch(`${API_BASE}/medical-records/${id}/download`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  },
};

// Lab Tests
export const labTestAPI = {
  getAll: (params = '') => api.get(`/lab-tests?${params}`),
  create: (data) => api.post('/lab-tests', data),
  updateStatus: (id, data) => api.patch(`/lab-tests/${id}/status`, data),
  uploadReport: (id, formData) => api.uploadPatch(`/lab-tests/${id}/upload-report`, formData),
};

// Medicines
export const medicineAPI = {
  getAll: (params = '') => api.get(`/medicines?${params}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  updateStock: (id, data) => api.patch(`/medicines/${id}/stock`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
};

// Invoices
export const invoiceAPI = {
  getAll: (params = '') => api.get(`/invoices?${params}`),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  pay: (id, data) => api.patch(`/invoices/${id}/pay`, data),
  insuranceClaim: (id, data) => api.patch(`/invoices/${id}/insurance-claim`, data),
};

// Rooms
export const roomAPI = {
  getAll: (params = '') => api.get(`/rooms?${params}`),
  create: (data) => api.post('/rooms', data),
  admit: (id, data) => api.patch(`/rooms/${id}/admit`, data),
  discharge: (id) => api.patch(`/rooms/${id}/discharge`, {}),
};

// Emergency
export const emergencyAPI = {
  getAll: () => api.get('/emergency'),
  register: (data) => api.post('/emergency', data),
};

// Notifications
export const notificationAPI = {
  getAll: (params = '') => api.get(`/notifications?${params}`),
  markRead: (id) => api.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/notifications/mark-all-read', {}),
};

// Audit Logs
export const auditLogAPI = {
  getAll: (params = '') => api.get(`/audit-logs?${params}`),
};

// Users
export const userAPI = {
  getAll: (params = '') => api.get(`/users?${params}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggle: (id) => api.patch(`/users/${id}/toggle`, {}),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getDoctorStats: () => api.get('/dashboard/doctor'),
  getNurseStats: () => api.get('/dashboard/nurse'),
  getReceptionistStats: () => api.get('/dashboard/receptionist'),
  getLabStats: () => api.get('/dashboard/lab'),
  getPharmacistStats: () => api.get('/dashboard/pharmacist'),
  getBillingStats: () => api.get('/dashboard/billing'),
  getPatientStats: () => api.get('/dashboard/patient'),
};

// AI
export const aiAPI = {
  analyzeSymptoms: (symptoms) => api.post('/ai/symptom-analysis', { symptoms }),
  summarizeRecords: (patient, records) => api.post('/ai/summarize-records', { patient, records }),
  explainPrescription: (medicineName, question) => api.post('/ai/explain-prescription', { medicineName, question }),
  appointmentAssistant: (query, doctors) => api.post('/ai/appointment-assistant', { query, doctors }),
  operationsInsight: (query, stats) => api.post('/ai/operations-insight', { query, stats }),
  chat: (message, context) => api.post('/ai/chat', { message, context }),
};
