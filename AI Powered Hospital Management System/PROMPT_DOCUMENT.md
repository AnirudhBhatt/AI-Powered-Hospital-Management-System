# Prompt Document — HMS Pro

This document registers the engineering prompts used to design, scaffold, write, and configure the database models, API routes, user interfaces, layouts, and Gemini AI agent system prompts for **HMS Pro**.

---

## 🗄️ Section 1: Database Schema Design Prompts

The following prompts were used to generate the Mongoose schemas representing the hospital's clinical and administrative entities:

```text
Design a set of 12 MongoDB Mongoose schemas for an enterprise Hospital Management System. 
The schemas must be:
1. User (name, email, password, role [super_admin, hospital_admin, doctor, nurse, receptionist, lab_technician, pharmacist, billing_executive, patient], department, phone, isActive)
2. Patient (userId ref User, dob, gender, bloodGroup, emergencyContact, address, insurance, medicalHistory [allergies, diseases, surgeries, medications], isAdmitted, roomId)
3. Doctor (userId ref User, doctorId, specialization, department, qualifications, experience, consultationFee, rating, schedule [weekly availability], isAvailable)
4. Appointment (appointmentId, patientId, doctorId, date, timeSlot, status [Requested, Confirmed, In Consultation, Completed, Cancelled], symptoms, notes, diagnosis)
5. Prescription (prescriptionId, patientId, doctorId, diagnosis, medicines [name, dosage, frequency, duration, instructions], treatmentPlan, status [Active, Dispensed])
6. MedicalRecord (patientId, title, type [Prescription, Lab Report, X-Ray, MRI, etc], fileUrl, fileData, tags, isConfidential)
7. LabTest (testId, patientId, doctorId, testName, testType, priority [Normal, Urgent, Emergency], status [Ordered, Sample Collected, Testing, Report Generated, Reviewed], result, cost)
8. Medicine (name, genericName, category, manufacturer, stock, minStock, price, expiryDate, batchNumber)
9. Invoice (invoiceId, patientId, items [desc, quantity, price, total], subtotal, tax, discount, totalAmount, status [Pending, Paid, Partial, Cancelled], paymentMethod)
10. Room (roomNumber, ward [ICU, General, Private, Maternity], type [Single, Double, Suite], dailyRate, isOccupied, patientId)
11. Notification (userId, title, message, type, isRead, priority)
12. AuditLog (userId, userEmail, userRole, action [CREATE, UPDATE, DELETE, LOGIN], resource, details, status)

Ensure standard timestamps, relationships, references, and validation rules are configured.
```

---

## 🌐 Section 2: API Route Design Prompts

The following prompt was used to architect the RESTful backend endpoints, incorporating authentication verification and RBAC protection:

```text
Write express router controllers and endpoints matching the 12 HMS modules.
Group endpoints logically under:
- /api/v1/auth (register, login, me, refresh)
- /api/v1/users (get all, create staff, toggle active status)
- /api/v1/patients (profile, history, update)
- /api/v1/appointments (schedule, update status)
- /api/v1/prescriptions (create, dispense, get history)
- /api/v1/lab-tests (order, update workflow state, upload results)
- /api/v1/rooms (admit, discharge, occupancy list)
- /api/v1/invoices (generate, record payment, claim insurance)
- /api/v1/medicines (inventory list, update stock levels)
- /api/v1/notifications (mark read, user alerts feed)
- /api/v1/audit-logs (audit logging logs, superadmin read-only)
- /api/v1/ai (symptom-analysis, summarize-records, explain-prescription, appointment-assistant, operations-insight, chat)
- /api/v1/doctors (list, create profile, update schedule, get available slots)
- /api/v1/medical-records (upload with file, list, download, delete)
- /api/v1/dashboard (admin stats, doctor stats, nurse stats, receptionist stats, lab stats, pharmacist stats, billing stats, patient stats)
- /api/v1/emergency (list active, register emergency case with auto-assign)

Incorporate a JWT verification middleware and an RBAC middleware:
- protect checks Bearer tokens in headers.
- authorize('doctor', 'receptionist') restricts route access based on user role.
Save database transactions and log CREATE, UPDATE, DELETE changes to AuditLogs.
```

---

## 💻 Section 3: Frontend Layout & UI Prompts

The following prompt was used to design the premium dark UI, using vanilla CSS variables for glassmorphism styles, layouts, and cards:

```text
Create a global CSS stylesheet (globals.css) and shared layouts for a dark-themed hospital management application.
Aesthetic Guidelines:
- Primary Color: Slate-indigo (#6366f1) and Neon Blue (#0ea5e9).
- Background: Pitch dark (#0f0f1a) and Card backgrounds (#16213e) with glassmorphism overlays (rgba borders).
- Font: 'Outfit' for titles and 'Inter' for body.
- Use animations for loading spinners, hover transitions, and pulse alerts.
- Define layout classes for a responsive collapsible Sidebar navigation, a top dashboard TopBar with notifications bell, stat cards, invoices, tables, dialog modals, and status badges.
- Ensure all pages use clean, structured HTML classes (like stat-card, btn-primary, table-container) and absolutely no Tailwind CSS.
```

---

## 🤖 Section 4: Gemini AI System Prompts

The actual system prompts embedded in the AI service layer:

### 1. AI Symptom Analyzer
```text
You are an AI Clinical Triage Assistant. Analyze the patient's symptoms and return a JSON object containing: possibleConditions (array of strings), recommendedDepartment (one of: Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Dermatology, Emergency), urgencyLevel (Low, Moderate, High, Emergency), advice (string), and disclaimer (standard medical disclaimer). Keep your tone calm, objective, and clear.
```

### 2. AI Medical Record Summarizer
```text
You are an Expert EMR Summarizer. Review the patient's medical history, prescriptions, and lab tests provided. Generate a concise, bulleted clinical summary in Markdown format highlighting:
1. Known Allergies (Crucial)
2. Active Conditions & Diagnosis History
3. Current Medications (Name, dosage)
4. Notable Lab & Diagnostic Results
Keep it strictly professional and optimized for a doctor to review in 10 seconds.
```

### 3. AI Prescription Explainer
```text
You are an AI Pharmacist. Explain the usage, side effects, and guidelines for the requested medication. Translate complex pharmaceutical jargon into simple, patient-friendly language. Always include a disclaimer warning the patient to consult their doctor or pharmacist before making changes to their medication regimen.
```

### 4. AI Appointment Assistant
```text
You are a Hospital Scheduling Assistant. Match the patient's query against the list of doctors, specializations, and weekly rosters. Recommend the best matching doctor and output available slots as a JSON object.
```

### 5. AI Operations Dashboard
```text
You are a Hospital Operations Analyst. Review the hospital statistics provided (invoicing, bed occupancy, department stats) and answer the administrator's query. Provide insights and actionable recommendations in a structured JSON object.
```

### 6. AI Operations Insight
```text
You are an AI operations analyst for a hospital. An administrator asks: "{query}". Hospital stats: {stats}. Provide detailed insights about hospital performance, potential issues, and actionable recommendations. Be specific and data-driven.
```

### 7. General AI Chat
```text
[Role-aware dynamic context based on user role]
- Patient: You are a friendly hospital AI assistant helping a patient understand their health, appointments, and reports.
- Doctor: You are a medical AI assistant helping a doctor with clinical decision support and patient information.
- Hospital Admin: You are a hospital operations AI analyst helping the administrator with performance insights.
- Default: You are a helpful hospital management system AI assistant.

User message: {message}. Provide a helpful, professional response.
```

---

## 📎 Section 5: File Upload Prompt

The following prompt was used to implement file upload capabilities:

```text
Add file upload functionality to the medical records module using Multer.
- Use disk storage with auto-created directories under /uploads/medical-records/.
- Generate unique filenames using timestamp + random suffix.
- Limit file size to 10MB.
- Allow only PDF, JPG, JPEG, PNG, and DICOM file formats.
- Serve the /uploads directory as static Express content.
- Add a download endpoint that streams the file to the client.
- Add Multer error handling middleware in server.js.
```

---

## 🌱 Section 6: Seeder Data Prompt

The following prompt was used to generate comprehensive seed data for development and demo purposes:

```text
Create a database seeder script (seed/seeder.js) that populates all 12 collections with realistic demo data.
The seeder should:
- Clear all existing data before seeding.
- Create 12 users covering all 9 roles (super_admin, hospital_admin, 3 doctors, nurse, receptionist, lab_technician, pharmacist, billing_executive, 2 patients).
- Create 3 doctor profiles with weekly schedules and different specializations (Cardiology, Neurology, Orthopedics).
- Create 2 patient profiles with complete demographics, emergency contacts, insurance, and medical history.
- Create 5 appointments across different statuses (Requested, Confirmed, Completed, Emergency).
- Create 2 prescriptions with multiple medicines and treatment plans.
- Create 3 lab tests in different workflow stages (Ordered, Testing, Report Generated).
- Create 10 medicines with realistic stock levels, pricing, and expiry dates, including some low-stock items.
- Create 3 invoices in different states (Paid, Pending, Partial) with insurance claims.
- Create 8 rooms across different wards (General, Private, ICU, Emergency, Maternity, Surgical).
- Create 6 notifications of various types and priorities.
- Create 3 audit log entries.
- Print a formatted credentials table at the end for easy reference.
All passwords should be bcrypt-hashed. Use realistic Indian names and medical data.
```

---

## 🧠 Section 7: AI Suggestions & Co-Pilot Interactions

During development, the AI was prompted to review logic and ensure security:

*   **Co-Pilot Schema Validation**: Asked to check if Mongoose models have appropriate references (`ref: 'User'`) and cascade deletions (e.g. freeing a room when a patient is discharged).
*   **Security Alignment**: Verified that role permission rules align with the RBAC matrix, specifically blocking patients from querying other users' audit logs or doctors' private consultation schedules.
*   **AI Fallback Logic**: Suggested implementing a check for `process.env.GEMINI_API_KEY` to return simulated JSON responses in developer mode when an API key is missing.
