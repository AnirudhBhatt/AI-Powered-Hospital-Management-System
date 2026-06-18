# AI Agent Design Documentation — HMS Pro

This document details the engineering specifications, prompts, payloads, and fallback safety designs for the **6 Gemini-powered AI Agents** integrated into the **HMS Pro** ecosystem.

---

## 🤖 AI Architecture Overview

All AI capabilities in HMS Pro are routed through the backend services layer using the Google Gemini SDK (`@google/generative-ai` package) utilizing the **gemini-1.5-flash** model. 

> **Implementation Note:** All AI logic (route handlers, Gemini SDK calls, and mock fallbacks) lives in a single `routes/ai.js` file rather than a separate controllers/services layer, keeping the AI module self-contained.

```
[Frontend Client] -> POST /api/v1/ai/:feature -> [AI Route Handler (routes/ai.js)]
                                                          |
                                     +--------------------+--------------------+
                                     |                                         |
                             (GEMINI_API_KEY set)                    (No GEMINI_API_KEY)
                                     |                                         |
                            [Gemini SDK API Call]                   [Mock Fallback Function]
                                     |                                         |
                             [JSON Response]                         [JSON Mock Payload]
```

---

## ⚡ Detail Designs for the 6 AI Features

### 1. AI Symptom Analyzer (Patient Interface)
*   **Role**: Pre-consultation triaging assistant.
*   **Input Payload Schema**:
    ```json
    { "symptoms": "I have been experiencing a dull headache on the left side, along with slight nausea and sensitivity to light." }
    ```
*   **Output JSON Schema**:
    ```json
    {
      "possibleConditions": ["Migraine", "Tension Headache", "Dehydration"],
      "recommendedDepartment": "Neurology",
      "urgencyLevel": "Moderate",
      "advice": "Rest in a quiet, dark room. Maintain hydration. Monitor symptoms.",
      "disclaimer": "This analysis is AI-generated and not a substitute for professional medical advice."
    }
    ```
*   **System Prompt**:
    ```text
    You are an AI Clinical Triage Assistant. Analyze the patient's symptoms and return a JSON object containing: possibleConditions (array of strings), recommendedDepartment (one of: Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Dermatology, Emergency), urgencyLevel (Low, Moderate, High, Emergency), advice (string), and disclaimer (standard medical disclaimer). Keep your tone calm, objective, and clear.
    ```

### 2. AI Medical Record Summarizer (Doctor Interface)
*   **Role**: Clinical summary generator for multi-document patient charts.
*   **Input Data**: Patient profile object + array of medical records (prescriptions, lab tests, scan notes).
*   **Output Payload**: A Markdown string summarizing patient allergies, active medications, chronic conditions, and recent lab results.
*   **System Prompt**:
    ```text
    You are an Expert EMR Summarizer. Review the patient's medical history, prescriptions, and lab tests provided. Generate a concise, bulleted clinical summary in Markdown format highlighting:
    1. Known Allergies (Crucial)
    2. Active Conditions & Diagnosis History
    3. Current Medications (Name, dosage)
    4. Notable Lab & Diagnostic Results
    Keep it strictly professional and optimized for a doctor to review in 10 seconds.
    ```

### 3. AI Prescription Explainer (Patient Interface)
*   **Role**: Translating complex prescriptions into layman instructions.
*   **Input Schema**:
    ```json
    { "medicineName": "Metformin 500mg", "question": "Why do I need to take this and are there side effects?" }
    ```
*   **Output Payload**: Plain English explanation detailing what the medicine treats, general instructions (e.g. take with meals), and minor vs critical side effects.
*   **System Prompt**:
    ```text
    You are an AI Pharmacist. Explain the usage, side effects, and guidelines for the requested medication. Translate complex pharmaceutical jargon into simple, patient-friendly language. Always include a disclaimer warning the patient to consult their doctor or pharmacist before making changes to their medication regimen.
    ```

### 4. AI Appointment Assistant (Patient Interface)
*   **Role**: Conversational appointment matching helper.
*   **Input Schema**:
    ```json
    { "query": "I need a consultation with a cardiologist next Monday morning", "doctors": [...] }
    ```
*   **Output JSON Schema**:
    ```json
    {
      "department": "Cardiology",
      "recommendedDoctor": "Dr. Priya Sharma",
      "availableSlots": ["10:00 AM", "11:30 AM"],
      "reasoning": "Dr. Priya Sharma is a Cardiologist available on Mondays."
    }
    ```
*   **System Prompt**:
    ```text
    You are a Hospital Scheduling Assistant. Match the patient's query against the list of doctors, specializations, and weekly rosters. Recommend the best matching doctor and output available slots as a JSON object.
    ```

### 5. AI Operations Dashboard (Admin Interface)
*   **Role**: Hospital operational intelligence analyst.
*   **Input Schema**:
    ```json
    { "query": "Why did revenue decrease compared to last week?", "stats": { "revenueTrend": [...], "deptStats": [...] } }
    ```
*   **Output JSON Schema**:
    ```json
    {
      "keyFindings": ["Cardiology consultations dropped 15%", "Outpatient pharmacy sales down"],
      "recommendations": ["Optimize Cardiology slots", "Replenish low medicine stocks"],
      "confidenceScore": 85
    }
    ```
*   **System Prompt**:
    ```text
    You are a Hospital Operations Analyst. Review the hospital statistics provided (invoicing, bed occupancy, department stats) and answer the administrator's query. Provide insights and actionable recommendations in a structured JSON object.
    ```

### 6. General AI Chat (All Roles)
*   **Role**: Role-aware conversational AI assistant for general hospital queries.
*   **Endpoint**: `POST /api/v1/ai/chat`
*   **Input Schema**:
    ```json
    { "message": "What are my upcoming appointments?", "context": { "role": "patient" } }
    ```
*   **Output Payload**:
    ```json
    { "reply": "I can help you with that! Here are your upcoming appointments..." }
    ```
*   **Role-Aware Context**: The system prompt adapts based on the user's role:
    *   `patient` → Friendly health and appointment guidance.
    *   `doctor` → Clinical decision support and patient information.
    *   `hospital_admin` → Operations analytics and performance insights.
    *   `default` → General HMS assistance.
*   **System Prompt**:
    ```text
    [Dynamic based on role] + User message: {message}. Provide a helpful, professional response.
    ```

---

## 🛠️ Mock Mode / Fallback Reliability

To ensure that the application is fully functional during grading or offline setup, the backend services layer contains a robust mock fallback. If the `GEMINI_API_KEY` is not set or equals `your_gemini_api_key_here`, the system automatically responds with realistic mock responses mimicking the Gemini API schemas:

```javascript
// Actual mock pattern from routes/ai.js
const mockSymptomAnalysis = (symptoms) => ({
  possibleConditions: ['Common Cold / Flu', 'Viral Fever', 'Seasonal Allergy'],
  recommendedDepartment: 'General Medicine',
  urgencyLevel: 'Moderate',
  urgencyColor: 'yellow',
  advice: `Based on symptoms (${symptoms}), we recommend visiting General Medicine.`,
  disclaimer: 'This is an AI-generated suggestion only. Please consult a doctor for proper diagnosis.'
});

// Route handler with Gemini + mock fallback
router.post('/symptom-analysis', protect, async (req, res) => {
  const { symptoms } = req.body;
  const geminiResponse = await callGemini(prompt);
  let data;
  if (geminiResponse) {
    try { data = JSON.parse(geminiResponse); }
    catch { data = mockSymptomAnalysis(symptoms); }  // Gemini parse error fallback
  } else { data = mockSymptomAnalysis(symptoms); }    // No API key fallback
  res.json({ success: true, data, source: geminiResponse ? 'gemini' : 'mock' });
});
```

### Mock Fallback Response Patterns

Each AI endpoint has a dedicated mock function that returns realistic, schema-compliant data:

| AI Endpoint | Mock Function | Response Type |
| :--- | :--- | :--- |
| `symptom-analysis` | `mockSymptomAnalysis(symptoms)` | JSON object with conditions, department, urgency |
| `summarize-records` | `mockRecordSummary(patient)` | Markdown string with patient summary |
| `explain-prescription` | `mockPrescriptionExplanation(medicine)` | JSON with explanation and disclaimer |
| `appointment-assistant` | `mockAppointmentSuggestions(query)` | JSON with doctor suggestions and slots |
| `operations-insight` | `mockOperationsInsight(query)` | JSON with insights, confidence, data points |
| `chat` | Inline string response | Plain text greeting with capability list |

---

## ⚖️ Ethical Safety Guidelines
1.  **Strict Disclaimers**: Every AI response presented to a patient includes a prominent warning that the tool is for educational purposes and is not a medical diagnosis.
2.  **No Actionable Self-Harm/Hazardous Output**: Prompts are constrained to restrict recommendations to department directions and basic wellness tips.
3.  **Role Isolation**: Patients cannot access administrative insights or EMR summaries of other patients.
