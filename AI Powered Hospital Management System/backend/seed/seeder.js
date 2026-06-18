require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const LabTest = require('../models/LabTest');
const Medicine = require('../models/Medicine');
const Invoice = require('../models/Invoice');
const Room = require('../models/Room');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hms_db';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('🗄️  Connected to MongoDB for seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany(), Patient.deleteMany(), Doctor.deleteMany(),
    Appointment.deleteMany(), Prescription.deleteMany(), MedicalRecord.deleteMany(),
    LabTest.deleteMany(), Medicine.deleteMany(), Invoice.deleteMany(),
    Room.deleteMany(), Notification.deleteMany(), AuditLog.deleteMany()
  ]);
  console.log('🧹 Cleared existing data');

  // ===== USERS =====
  const users = await User.insertMany([
    { name: 'Super Admin', email: 'superadmin@hms.com', password: await bcrypt.hash('Admin@123', 12), role: 'super_admin', isActive: true },
    { name: 'Dr. Rajesh Kumar', email: 'admin@hms.com', password: await bcrypt.hash('Admin@123', 12), role: 'hospital_admin', department: 'Administration', isActive: true },
    { name: 'Dr. Priya Sharma', email: 'doctor@hms.com', password: await bcrypt.hash('Doctor@123', 12), role: 'doctor', department: 'Cardiology', isActive: true },
    { name: 'Dr. Amit Patel', email: 'doctor2@hms.com', password: await bcrypt.hash('Doctor@123', 12), role: 'doctor', department: 'Neurology', isActive: true },
    { name: 'Dr. Sunita Rao', email: 'doctor3@hms.com', password: await bcrypt.hash('Doctor@123', 12), role: 'doctor', department: 'Orthopedics', isActive: true },
    { name: 'Nurse Kavita Singh', email: 'nurse@hms.com', password: await bcrypt.hash('Nurse@123', 12), role: 'nurse', department: 'General Ward', isActive: true },
    { name: 'Receptionist Meera', email: 'reception@hms.com', password: await bcrypt.hash('Reception@123', 12), role: 'receptionist', department: 'Front Desk', isActive: true },
    { name: 'Lab Tech Rohit', email: 'lab@hms.com', password: await bcrypt.hash('Lab@123', 12), role: 'lab_technician', department: 'Laboratory', isActive: true },
    { name: 'Pharmacist Deepa', email: 'pharmacy@hms.com', password: await bcrypt.hash('Pharma@123', 12), role: 'pharmacist', department: 'Pharmacy', isActive: true },
    { name: 'Billing Exec Ravi', email: 'billing@hms.com', password: await bcrypt.hash('Billing@123', 12), role: 'billing_executive', department: 'Billing', isActive: true },
    { name: 'Arjun Mehta', email: 'patient@hms.com', password: await bcrypt.hash('Patient@123', 12), role: 'patient', isActive: true },
    { name: 'Sanya Kapoor', email: 'patient2@hms.com', password: await bcrypt.hash('Patient@123', 12), role: 'patient', isActive: true },
  ]);

  const [superAdmin, adminUser, doctorUser1, doctorUser2, doctorUser3, nurseUser, receptionUser, labUser, pharmacyUser, billingUser, patientUser1, patientUser2] = users;
  console.log('👤 Users created');

  // ===== DOCTORS =====
  const doctors = await Doctor.insertMany([
    {
      userId: doctorUser1._id, doctorId: 'DOC-001', name: 'Dr. Priya Sharma',
      specialization: 'Cardiologist', department: 'Cardiology',
      qualifications: ['MBBS', 'MD (Cardiology)', 'DM (Cardiology)'],
      experience: 12, consultationFee: 800, rating: 4.8, phone: '9876543210',
      schedule: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Friday', startTime: '09:00', endTime: '13:00', isAvailable: true }
      ]
    },
    {
      userId: doctorUser2._id, doctorId: 'DOC-002', name: 'Dr. Amit Patel',
      specialization: 'Neurologist', department: 'Neurology',
      qualifications: ['MBBS', 'MD (Neurology)', 'DM (Neurology)'],
      experience: 15, consultationFee: 1000, rating: 4.9, phone: '9876543211',
      schedule: [
        { day: 'Tuesday', startTime: '10:00', endTime: '18:00', isAvailable: true },
        { day: 'Thursday', startTime: '10:00', endTime: '18:00', isAvailable: true },
        { day: 'Saturday', startTime: '09:00', endTime: '14:00', isAvailable: true }
      ]
    },
    {
      userId: doctorUser3._id, doctorId: 'DOC-003', name: 'Dr. Sunita Rao',
      specialization: 'Orthopedic Surgeon', department: 'Orthopedics',
      qualifications: ['MBBS', 'MS (Orthopedics)'],
      experience: 8, consultationFee: 700, rating: 4.6, phone: '9876543212',
      schedule: [
        { day: 'Monday', startTime: '11:00', endTime: '19:00', isAvailable: true },
        { day: 'Wednesday', startTime: '11:00', endTime: '19:00', isAvailable: true },
        { day: 'Friday', startTime: '11:00', endTime: '16:00', isAvailable: true }
      ]
    }
  ]);
  console.log('👨‍⚕️ Doctors created');

  // ===== PATIENTS =====
  const patients = await Patient.insertMany([
    {
      userId: patientUser1._id, patientId: 'PAT-001', name: 'Arjun Mehta',
      dob: new Date('1990-05-15'), gender: 'Male', bloodGroup: 'B+',
      phone: '9988776655', email: 'patient@hms.com',
      address: { street: '42 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      emergencyContact: { name: 'Priya Mehta', relation: 'Spouse', phone: '9988776644' },
      insurance: { provider: 'Star Health Insurance', policyNumber: 'SHI-2024-001', validUntil: new Date('2025-12-31') },
      medicalHistory: {
        allergies: ['Penicillin', 'Sulfa drugs'],
        previousDiseases: ['Hypertension (2018)', 'Dengue (2020)'],
        surgeries: [{ description: 'Appendectomy', date: new Date('2019-03-10') }],
        currentMedications: [{ name: 'Amlodipine 5mg', dosage: '1 tablet daily' }, { name: 'Metoprolol 25mg', dosage: '1 tablet twice daily' }]
      }
    },
    {
      userId: patientUser2._id, patientId: 'PAT-002', name: 'Sanya Kapoor',
      dob: new Date('1985-11-20'), gender: 'Female', bloodGroup: 'A+',
      phone: '9977665544', email: 'patient2@hms.com',
      address: { street: '15 Park Street', city: 'Delhi', state: 'Delhi', pincode: '110001' },
      emergencyContact: { name: 'Vikram Kapoor', relation: 'Husband', phone: '9977665533' },
      insurance: { provider: 'HDFC ERGO', policyNumber: 'HE-2024-002', validUntil: new Date('2026-03-31') },
      medicalHistory: {
        allergies: ['Aspirin'],
        previousDiseases: ['Diabetes Type 2 (2020)', 'Hypothyroidism (2018)'],
        surgeries: [],
        currentMedications: [{ name: 'Metformin 500mg', dosage: '1 tablet twice daily' }, { name: 'Thyroxine 50mcg', dosage: '1 tablet morning' }]
      }
    }
  ]);
  console.log('🤒 Patients created');

  // ===== APPOINTMENTS =====
  const today = new Date();
  const appointments = await Appointment.insertMany([
    {
      appointmentId: 'APT-001', patientId: patients[0]._id, doctorId: doctors[0]._id,
      department: 'Cardiology', date: today, timeSlot: '10:00 AM',
      status: 'Confirmed', type: 'Regular', symptoms: 'Chest pain and shortness of breath',
      notes: 'Patient has history of hypertension', createdBy: patientUser1._id
    },
    {
      appointmentId: 'APT-002', patientId: patients[1]._id, doctorId: doctors[1]._id,
      department: 'Neurology', date: new Date(today.getTime() + 86400000), timeSlot: '11:00 AM',
      status: 'Requested', type: 'Regular', symptoms: 'Severe headache and dizziness',
      createdBy: patientUser2._id
    },
    {
      appointmentId: 'APT-003', patientId: patients[0]._id, doctorId: doctors[0]._id,
      department: 'Cardiology', date: new Date(today.getTime() - 7 * 86400000), timeSlot: '2:00 PM',
      status: 'Completed', type: 'Regular', symptoms: 'Follow-up visit',
      diagnosis: 'Stable hypertension, continue current medications', createdBy: patientUser1._id
    },
    {
      appointmentId: 'APT-004', patientId: patients[1]._id, doctorId: doctors[2]._id,
      department: 'Orthopedics', date: new Date(today.getTime() - 14 * 86400000), timeSlot: '3:00 PM',
      status: 'Completed', type: 'Regular', symptoms: 'Right knee pain',
      diagnosis: 'Mild osteoarthritis', createdBy: patientUser2._id
    },
    {
      appointmentId: 'APT-005', patientId: patients[0]._id, doctorId: doctors[2]._id,
      department: 'Emergency', date: new Date(today.getTime() - 2 * 86400000), timeSlot: 'Immediate',
      status: 'Completed', type: 'Emergency', symptoms: 'Severe lower back pain',
      diagnosis: 'Lumbar sprain', createdBy: receptionUser._id
    }
  ]);
  console.log('📅 Appointments created');

  // ===== PRESCRIPTIONS =====
  await Prescription.insertMany([
    {
      prescriptionId: 'PRE-001', patientId: patients[0]._id, doctorId: doctors[0]._id,
      appointmentId: appointments[2]._id, diagnosis: 'Hypertension (Stage 1)',
      symptoms: 'High blood pressure, occasional headaches',
      medicines: [
        { name: 'Amlodipine 5mg', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take in the morning with water' },
        { name: 'Metoprolol 25mg', dosage: '25mg', frequency: 'Twice daily', duration: '30 days', instructions: 'Take with food' },
        { name: 'Aspirin 75mg', dosage: '75mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take after breakfast' }
      ],
      treatmentPlan: 'Continue antihypertensives. Low-salt diet. Regular exercise 30 min/day. Follow-up in 4 weeks.',
      followUpDate: new Date(today.getTime() + 28 * 86400000),
      status: 'Active'
    },
    {
      prescriptionId: 'PRE-002', patientId: patients[1]._id, doctorId: doctors[2]._id,
      appointmentId: appointments[3]._id, diagnosis: 'Osteoarthritis Right Knee',
      symptoms: 'Joint pain, stiffness, mild swelling',
      medicines: [
        { name: 'Diclofenac 50mg', dosage: '50mg', frequency: 'Twice daily', duration: '7 days', instructions: 'Take with food, avoid on empty stomach' },
        { name: 'Pantoprazole 40mg', dosage: '40mg', frequency: 'Once daily', duration: '7 days', instructions: 'Take 30 minutes before meal' }
      ],
      treatmentPlan: 'Rest the joint. Ice packs for swelling. Physiotherapy recommended. Avoid high-impact exercise.',
      followUpDate: new Date(today.getTime() + 14 * 86400000),
      status: 'Dispensed', dispensedAt: new Date(today.getTime() - 13 * 86400000)
    }
  ]);
  console.log('💊 Prescriptions created');

  // ===== LAB TESTS =====
  await LabTest.insertMany([
    {
      testId: 'LAB-001', patientId: patients[0]._id, doctorId: doctors[0]._id,
      appointmentId: appointments[0]._id, testType: 'Blood Test', testName: 'Complete Blood Count (CBC)',
      priority: 'Normal', status: 'Report Generated',
      sampleCollectedAt: new Date(today.getTime() - 6 * 3600000),
      testStartedAt: new Date(today.getTime() - 5 * 3600000),
      completedAt: new Date(today.getTime() - 2 * 3600000),
      result: 'Hemoglobin: 13.2 g/dL (Normal), WBC: 8500/µL (Normal), Platelets: 220000/µL (Normal). No significant abnormalities.',
      processedBy: labUser._id, cost: 450
    },
    {
      testId: 'LAB-002', patientId: patients[0]._id, doctorId: doctors[0]._id,
      testType: 'ECG', testName: 'Electrocardiogram (ECG)',
      priority: 'Urgent', status: 'Testing',
      sampleCollectedAt: new Date(today.getTime() - 2 * 3600000),
      testStartedAt: new Date(today.getTime() - 1 * 3600000),
      processedBy: labUser._id, cost: 300
    },
    {
      testId: 'LAB-003', patientId: patients[1]._id, doctorId: doctors[1]._id,
      testType: 'MRI', testName: 'MRI Brain (with contrast)',
      priority: 'Normal', status: 'Ordered', cost: 3500
    }
  ]);
  console.log('🔬 Lab Tests created');

  // ===== MEDICINES =====
  await Medicine.insertMany([
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', category: 'Tablet', manufacturer: 'Cipla', supplier: 'MedSupply India', stock: 500, minStock: 100, price: 8.50, expiryDate: new Date('2026-06-30'), batchNumber: 'CPL-2024-001' },
    { name: 'Metoprolol 25mg', genericName: 'Metoprolol Succinate', category: 'Tablet', manufacturer: 'Sun Pharma', supplier: 'MedSupply India', stock: 350, minStock: 80, price: 12.00, expiryDate: new Date('2026-09-30'), batchNumber: 'SUN-2024-002' },
    { name: 'Metformin 500mg', genericName: 'Metformin HCl', category: 'Tablet', manufacturer: 'Dr. Reddys', supplier: 'Pharma Depot', stock: 45, minStock: 100, price: 5.50, expiryDate: new Date('2026-12-31'), batchNumber: 'DRL-2024-003' },
    { name: 'Diclofenac 50mg', genericName: 'Diclofenac Sodium', category: 'Tablet', manufacturer: 'Novartis', supplier: 'Pharma Depot', stock: 600, minStock: 150, price: 4.00, expiryDate: new Date('2025-12-31'), batchNumber: 'NOV-2024-004' },
    { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole Sodium', category: 'Tablet', manufacturer: 'Abbott', supplier: 'MedSupply India', stock: 420, minStock: 100, price: 9.00, expiryDate: new Date('2026-03-31'), batchNumber: 'ABT-2024-005' },
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Tablet', manufacturer: 'Cipla', supplier: 'Generic Pharma', stock: 1200, minStock: 200, price: 2.50, expiryDate: new Date('2026-12-31'), batchNumber: 'CPL-2024-006' },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', category: 'Capsule', manufacturer: 'GSK', supplier: 'MedSupply India', stock: 30, minStock: 80, price: 15.00, expiryDate: new Date('2025-08-31'), batchNumber: 'GSK-2024-007' },
    { name: 'Insulin Glargine', genericName: 'Insulin Glargine', category: 'Injection', manufacturer: 'Novo Nordisk', supplier: 'Pharma Depot', stock: 80, minStock: 30, price: 450.00, expiryDate: new Date('2025-06-30'), batchNumber: 'NN-2024-008' },
    { name: 'Salbutamol Inhaler', genericName: 'Salbutamol Sulphate', category: 'Inhaler', manufacturer: 'GSK', supplier: 'Generic Pharma', stock: 95, minStock: 40, price: 180.00, expiryDate: new Date('2026-01-31'), batchNumber: 'GSK-2024-009' },
    { name: 'Cough Syrup (Adult)', genericName: 'Dextromethorphan + Guaifenesin', category: 'Syrup', manufacturer: 'Pfizer', supplier: 'MedSupply India', stock: 200, minStock: 50, price: 95.00, expiryDate: new Date('2025-11-30'), batchNumber: 'PFZ-2024-010' }
  ]);
  console.log('💉 Medicines created');

  // ===== INVOICES =====
  await Invoice.insertMany([
    {
      invoiceId: 'INV-001', patientId: patients[0]._id, appointmentId: appointments[2]._id,
      items: [
        { description: 'Cardiology Consultation', type: 'Consultation', quantity: 1, unitPrice: 800, total: 800 },
        { description: 'CBC Blood Test', type: 'Lab Test', quantity: 1, unitPrice: 450, total: 450 },
        { description: 'Amlodipine 5mg (30 tabs)', type: 'Medicine', quantity: 30, unitPrice: 8.50, total: 255 },
        { description: 'Metoprolol 25mg (30 tabs)', type: 'Medicine', quantity: 30, unitPrice: 12, total: 360 }
      ],
      subtotal: 1865, tax: 335.70, discount: 100, totalAmount: 2100.70,
      status: 'Paid', paymentMethod: 'UPI', paidAmount: 2100.70, paidAt: new Date(today.getTime() - 7 * 86400000),
      insurance: { provider: 'Star Health Insurance', claimId: 'SHI-CLM-001', claimStatus: 'Approved', coveredAmount: 1500 },
      createdBy: billingUser._id
    },
    {
      invoiceId: 'INV-002', patientId: patients[1]._id, appointmentId: appointments[3]._id,
      items: [
        { description: 'Orthopedics Consultation', type: 'Consultation', quantity: 1, unitPrice: 700, total: 700 },
        { description: 'Diclofenac 50mg (7 tabs)', type: 'Medicine', quantity: 7, unitPrice: 4, total: 28 },
        { description: 'Pantoprazole 40mg (7 tabs)', type: 'Medicine', quantity: 7, unitPrice: 9, total: 63 }
      ],
      subtotal: 791, tax: 142.38, discount: 0, totalAmount: 933.38,
      status: 'Pending', createdBy: billingUser._id
    },
    {
      invoiceId: 'INV-003', patientId: patients[0]._id,
      items: [
        { description: 'Emergency Consultation', type: 'Consultation', quantity: 1, unitPrice: 1500, total: 1500 },
        { description: 'X-Ray Lumbar Spine', type: 'Lab Test', quantity: 1, unitPrice: 800, total: 800 }
      ],
      subtotal: 2300, tax: 414, discount: 200, totalAmount: 2514,
      status: 'Partial', paymentMethod: 'Cash', paidAmount: 1500, paidAt: new Date(today.getTime() - 2 * 86400000),
      createdBy: billingUser._id
    }
  ]);
  console.log('🧾 Invoices created');

  // ===== ROOMS =====
  const rooms = await Room.insertMany([
    { roomNumber: '101', ward: 'General', type: 'Single', floor: 1, dailyRate: 1500, isOccupied: true, patientId: patients[0]._id, admittedAt: new Date(today.getTime() - 2 * 86400000), assignedDoctor: doctors[0]._id, features: ['AC', 'TV'] },
    { roomNumber: '102', ward: 'General', type: 'Double', floor: 1, dailyRate: 1000, isOccupied: false, features: ['AC'] },
    { roomNumber: '201', ward: 'Private', type: 'Suite', floor: 2, dailyRate: 5000, isOccupied: false, features: ['AC', 'TV', 'Attached Bathroom', 'Sofa'] },
    { roomNumber: '301', ward: 'ICU', type: 'ICU Bed', floor: 3, dailyRate: 8000, isOccupied: false, features: ['Ventilator Support', 'Cardiac Monitor'] },
    { roomNumber: '302', ward: 'ICU', type: 'ICU Bed', floor: 3, dailyRate: 8000, isOccupied: false, features: ['Ventilator Support', 'Cardiac Monitor'] },
    { roomNumber: '401', ward: 'Emergency', type: 'Emergency Bed', floor: 1, dailyRate: 2000, isOccupied: false, features: ['Emergency Equipment'] },
    { roomNumber: '501', ward: 'Maternity', type: 'Single', floor: 5, dailyRate: 3000, isOccupied: false, features: ['AC', 'TV', 'Baby Cot'] },
    { roomNumber: '601', ward: 'Surgical', type: 'Single', floor: 6, dailyRate: 2500, isOccupied: false, features: ['AC', 'Post-Op Monitoring'] }
  ]);

  // Update patient 1 room reference
  await Patient.findByIdAndUpdate(patients[0]._id, { isAdmitted: true, roomId: rooms[0]._id });
  console.log('🏥 Rooms created');

  // ===== NOTIFICATIONS =====
  await Notification.insertMany([
    { userId: patientUser1._id, title: 'Appointment Confirmed', message: 'Your appointment with Dr. Priya Sharma is confirmed for today at 10:00 AM', type: 'appointment', priority: 'high' },
    { userId: patientUser1._id, title: 'Lab Report Ready', message: 'Your CBC blood test report is ready for review', type: 'lab_report', priority: 'medium' },
    { userId: doctorUser1._id, title: 'New Appointment', message: 'New appointment request from Arjun Mehta for today 10:00 AM', type: 'appointment', priority: 'medium' },
    { userId: adminUser._id, title: '⚠️ Low Stock Alert', message: 'Metformin 500mg is running low (45 units remaining)', type: 'inventory', priority: 'high' },
    { userId: adminUser._id, title: '⚠️ Low Stock Alert', message: 'Amoxicillin 500mg is running low (30 units remaining)', type: 'inventory', priority: 'high' },
    { userId: patientUser2._id, title: 'Invoice Generated', message: 'Invoice #INV-002 for ₹933.38 has been generated', type: 'billing', priority: 'medium' }
  ]);
  console.log('🔔 Notifications created');

  // ===== AUDIT LOGS =====
  await AuditLog.insertMany([
    { userId: superAdmin._id, userEmail: 'superadmin@hms.com', userRole: 'super_admin', action: 'LOGIN', resource: 'Auth', status: 'success', ip: '127.0.0.1' },
    { userId: adminUser._id, userEmail: 'admin@hms.com', userRole: 'hospital_admin', action: 'CREATE', resource: 'Doctor', resourceId: 'DOC-001', details: 'Created doctor profile for Dr. Priya Sharma', status: 'success' },
    { userId: patientUser1._id, userEmail: 'patient@hms.com', userRole: 'patient', action: 'CREATE', resource: 'Appointment', resourceId: 'APT-001', details: 'Booked appointment with Dr. Priya Sharma', status: 'success' }
  ]);
  console.log('📋 Audit Logs created');

  console.log('\n✅ ============================================');
  console.log('   HMS Database Seeded Successfully!');
  console.log('============================================');
  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('┌──────────────────────┬──────────────────────┬──────────────┐');
  console.log('│ Role                 │ Email                │ Password     │');
  console.log('├──────────────────────┼──────────────────────┼──────────────┤');
  console.log('│ Super Admin          │ superadmin@hms.com   │ Admin@123    │');
  console.log('│ Hospital Admin       │ admin@hms.com        │ Admin@123    │');
  console.log('│ Doctor (Cardiology)  │ doctor@hms.com       │ Doctor@123   │');
  console.log('│ Doctor (Neurology)   │ doctor2@hms.com      │ Doctor@123   │');
  console.log('│ Nurse                │ nurse@hms.com        │ Nurse@123    │');
  console.log('│ Receptionist         │ reception@hms.com    │ Reception@123│');
  console.log('│ Lab Technician       │ lab@hms.com          │ Lab@123      │');
  console.log('│ Pharmacist           │ pharmacy@hms.com     │ Pharma@123   │');
  console.log('│ Billing Executive    │ billing@hms.com      │ Billing@123  │');
  console.log('│ Patient 1            │ patient@hms.com      │ Patient@123  │');
  console.log('│ Patient 2            │ patient2@hms.com     │ Patient@123  │');
  console.log('└──────────────────────┴──────────────────────┴──────────────┘');
  console.log('\n🚀 Start the backend: npm run dev');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(e => { console.error('Seed Error:', e); process.exit(1); });
