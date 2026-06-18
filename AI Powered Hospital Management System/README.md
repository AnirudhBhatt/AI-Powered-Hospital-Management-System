# AI-Powered Hospital & Healthcare Management System (HMS Pro)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018.0.0-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D%206.0-green.svg)](https://www.mongodb.com/)
[![Next.js](https://img.shields.io/badge/next.js-%3E%3D%2014.0-black.svg)](https://nextjs.org/)

HMS Pro is a state-of-the-art, enterprise-grade Hospital and Healthcare Management System designed to streamline patient care, doctor schedules, staff assignments, inventory control, billing operations, and inpatient accommodations. Powered by Google Gemini AI, it delivers intelligent clinical features like symptom analysis, medical record summarization, prescription explanation, and operational analytics.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Packages |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Vanilla CSS | `recharts`, `lucide-react`, `react-hot-toast` |
| **Backend** | Node.js, Express.js | `mongoose`, `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit` |
| **Database** | MongoDB | Mongoose ORM, indexing, references |
| **AI Layer** | Gemini AI / Mock Fallback | `@google/generative-ai` (gemini-1.5-flash) |

---

## 🚀 Key Features & Modules

The system is organized into **12 Core Modules** serving **9 User Roles** and featuring **5 Specialized AI Agent Integrations**:

### 1. The 9 Enterprise Roles
*   **Super Admin**: Platform control, global system settings, and comprehensive system audit logging.
*   **Hospital Admin**: Doctors/staff onboarding, bed/room occupancy control, and operations AI dashboard.
*   **Doctor**: Appointment scheduling, diagnosis logs, EMR uploads, prescriptions, and lab test orders.
*   **Nurse**: Ward management, vital signs tracking (BP, SpO2, Temp), and patient treatment updates.
*   **Receptionist**: Walk-in patient registration, scheduling, rescheduling, and doctor availability tracking.
*   **Lab Technician**: Test orders processing, sample collection workflow, and report data uploads.
*   **Pharmacist**: Medicine inventory management, low-stock alerts, and prescription fulfillment.
*   **Billing Executive**: Invoice generation, discount adjustments, UPI/card payment collection, and insurance claim creation.
*   **Patient**: Appointment booking, prescription details access, invoices payment, and medical records history.

### 2. The 5 AI Agent Integrations
1.  **AI Symptom Analyzer (Patient)**: Analyzes text descriptions of symptoms to predict conditions, suggest medical departments, and rate urgency levels.
2.  **AI Appointment Assistant (Patient)**: Conversational assistant recommending doctors and slots based on symptoms.
3.  **AI Prescription Helper (Patient)**: Translates complex prescription dosages and drug details into plain instructions.
4.  **AI Medical Record Summarizer (Doctor)**: Summarizes multi-document patient history to aid clinical decisions.
5.  **AI Operations Dashboard (Admin)**: Answers natural language questions about hospital stats and suggests improvements.

---

## 🔑 Seeded Login Credentials

Run the database seeder to register the following users (all passwords are `Admin@123`, `Doctor@123`, `Nurse@123`, `Reception@123`, `Lab@123`, `Pharma@123`, `Billing@123`, or `Patient@123` as shown below):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@hms.com` | `Admin@123` |
| **Hospital Admin** | `admin@hms.com` | `Admin@123` |
| **Doctor (Cardiology)** | `doctor@hms.com` | `Doctor@123` |
| **Doctor (Neurology)**| `doctor2@hms.com` | `Doctor@123` |
| **Nurse** | `nurse@hms.com` | `Nurse@123` |
| **Receptionist** | `reception@hms.com` | `Reception@123` |
| **Lab Technician** | `lab@hms.com` | `Lab@123` |
| **Pharmacist** | `pharmacy@hms.com` | `Pharma@123` |
| **Billing Executive** | `billing@hms.com` | `Billing@123` |
| **Patient 1** | `patient@hms.com` | `Patient@123` |
| **Patient 2** | `patient2@hms.com` | `Patient@123` |

---

## 🏁 Setup Instructions

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher)
*   [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

### Step 1: Clone the Repository
```bash
git clone <repository_url>
cd hms-project
```

### Step 2: Configure and Start the Backend
1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create an `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Configure the `.env` parameters (update `MONGODB_URI` or `GEMINI_API_KEY` as needed).
5.  Seed the database:
    ```bash
    npm run seed
    ```
6.  Start the development server (runs on port 5001):
    ```bash
    npm run dev
    ```

### Step 3: Configure and Start the Frontend
1.  Open a new terminal session and navigate to the frontend folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server (runs on port 3000):
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── backend/
│   ├── controllers/       # Route request handlers
│   ├── middleware/        # JWT Authentication, RBAC, Rate Limiting
│   ├── models/            # Mongoose Schemas (12 collections)
│   ├── routes/            # Express routers
│   ├── seed/              # Database seeder scripts
│   ├── services/          # AI agents using Gemini SDK
│   ├── server.js          # App entrypoint
│   └── package.json
└── frontend/
    ├── app/               # Next.js pages & layouts (9 dashboards)
    ├── components/        # Layout and chatbot widgets
    ├── lib/               # API clients, Context providers
    ├── public/            # Static files
    └── package.json
```

---

## 🗺️ API Endpoints Summary

### Authentication
*   `POST /api/v1/auth/register` - Register a patient
*   `POST /api/v1/auth/login` - User login
*   `POST /api/v1/auth/logout` - User logout
*   `GET /api/v1/auth/me` - Get current session

### Clinical Modules
*   `GET /api/v1/patients` - Get patients list
*   `POST /api/v1/patients` - Create patient
*   `GET /api/v1/doctors` - Get doctors list
*   `GET /api/v1/appointments` - Fetch appointments
*   `POST /api/v1/appointments` - Book appointment
*   `PATCH /api/v1/appointments/:id/status` - Update appointment status (In Consultation, Completed, Cancelled)
*   `POST /api/v1/prescriptions` - Create prescription
*   `GET /api/v1/prescriptions` - Get prescriptions
*   `POST /api/v1/lab-tests` - Order lab test
*   `PATCH /api/v1/lab-tests/:id/status` - Update lab test status

### Operational Modules
*   `GET /api/v1/rooms` - Room/bed availability
*   `PATCH /api/v1/rooms/:id/admit` - Admit patient
*   `PATCH /api/v1/rooms/:id/discharge` - Discharge patient
*   `GET /api/v1/medicines` - View pharmacy stock
*   `POST /api/v1/invoices` - Create invoices
*   `PATCH /api/v1/invoices/:id/pay` - Process payments
*   `GET /api/v1/audit-logs` - View audit trails (Super Admin only)
*   `GET /api/v1/notifications` - Fetch notification feeds

### AI Services
*   `POST /api/v1/ai/symptom-analysis` - Symptom analyser agent
*   `POST /api/v1/ai/summarize-records` - Medical record summarization
*   `POST /api/v1/ai/explain-prescription` - Medicine explainer agent
*   `POST /api/v1/ai/appointment-assistant` - Scheduling advisor agent
*   `POST /api/v1/ai/operations-insight` - Operational intelligence agent
*   `POST /api/v1/ai/chat` - Conversational chatbot
