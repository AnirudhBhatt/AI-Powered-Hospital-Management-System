const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Mock AI responses for when no API key is present
const mockSymptomAnalysis = (symptoms) => ({
  possibleConditions: ['Common Cold / Flu', 'Viral Fever', 'Seasonal Allergy'],
  recommendedDepartment: 'General Medicine',
  urgencyLevel: 'Moderate',
  urgencyColor: 'yellow',
  disclaimer: 'This is an AI-generated suggestion only. Please consult a doctor for proper diagnosis.',
  advice: `Based on symptoms (${symptoms}), we recommend visiting General Medicine. Monitor your temperature and stay hydrated. Seek emergency care if symptoms worsen rapidly.`
});

const mockRecordSummary = (patient) => `
**Patient Summary Report**

Patient ${patient?.name || 'N/A'} is a ${patient?.gender || 'N/A'} patient with blood group ${patient?.bloodGroup || 'Unknown'}.

**Medical History:**
- Known Allergies: ${patient?.medicalHistory?.allergies?.join(', ') || 'None reported'}
- Previous Diseases: ${patient?.medicalHistory?.previousDiseases?.join(', ') || 'None reported'}  
- Past Surgeries: ${patient?.medicalHistory?.surgeries?.length > 0 ? patient.medicalHistory.surgeries.map(s => s.description).join(', ') : 'None'}
- Current Medications: ${patient?.medicalHistory?.currentMedications?.length > 0 ? patient.medicalHistory.currentMedications.map(m => m.name).join(', ') : 'None'}

**Recommendations:** Regular follow-up recommended. Review allergy profile before prescribing new medications.
`;

const mockPrescriptionExplanation = (medicine) => ({
  explanation: `**About ${medicine}:**\n\nThis medication is commonly prescribed to treat infections and inflammation. Take as prescribed by your doctor.\n\n**How to take:** Usually taken with food to reduce stomach upset. Complete the full course even if you feel better.\n\n**Common side effects:** Nausea, headache, mild stomach discomfort. Contact your doctor if you experience severe reactions.\n\n**Important:** Do not take with alcohol. Store at room temperature.`,
  disclaimer: 'This is general information only. Always follow your doctor\'s specific instructions.'
});

const mockAppointmentSuggestions = (query) => ({
  message: `Based on your request: "${query}"`,
  suggestions: [
    { doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiology', availableSlots: ['10:00 AM', '2:00 PM', '4:30 PM'], rating: 4.8 },
    { doctorName: 'Dr. Priya Sharma', specialization: 'Internal Medicine', availableSlots: ['9:00 AM', '11:30 AM', '3:00 PM'], rating: 4.6 },
    { doctorName: 'Dr. Amit Patel', specialization: 'General Medicine', availableSlots: ['10:30 AM', '1:00 PM'], rating: 4.5 }
  ]
});

const mockOperationsInsight = (query) => ({
  insight: `**AI Operations Analysis:**\n\nBased on the hospital data analysis for your query: "${query}"\n\n📊 **Key Findings:**\n- Patient volume has increased 12% this month compared to last month\n- Revenue dip in Week 2 may be linked to reduced OPD footfall during the public holiday\n- Cardiology department shows highest utilization at 87%\n- Lab turnaround time averages 4.2 hours, recommend optimizing to <3 hours\n\n💡 **Recommendations:**\n1. Increase staffing on weekends when patient volume peaks\n2. Run promotional health checkup packages to boost low-revenue periods\n3. ICU beds at 94% occupancy — consider adding 4 more beds\n4. Pharmacy restock needed for 3 medicines hitting minimum threshold`,
  confidence: '87%',
  dataPoints: 'Analyzed 30 days of hospital operational data'
});

// Helper to call Gemini if API key exists
const callGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') return null;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) { console.log('Gemini error, using mock:', e.message); return null; }
};

// @route POST /api/v1/ai/symptom-analysis
router.post('/symptom-analysis', protect, async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ success: false, message: 'Symptoms are required' });
    const prompt = `You are a medical AI assistant for a hospital. A patient reports these symptoms: "${symptoms}". 
    Respond in JSON format with: { "possibleConditions": [...], "recommendedDepartment": "...", "urgencyLevel": "Low|Moderate|High|Emergency", "urgencyColor": "green|yellow|orange|red", "advice": "...", "disclaimer": "Not a medical diagnosis" }`;
    const geminiResponse = await callGemini(prompt);
    let data;
    if (geminiResponse) {
      try { data = JSON.parse(geminiResponse.replace(/```json\n?|\n?```/g, '')); }
      catch { data = mockSymptomAnalysis(symptoms); }
    } else { data = mockSymptomAnalysis(symptoms); }
    res.json({ success: true, data, source: geminiResponse ? 'gemini' : 'mock' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/ai/summarize-records
router.post('/summarize-records', protect, async (req, res) => {
  try {
    const { patient, records } = req.body;
    const prompt = `You are a medical AI assistant. Summarize this patient's medical history in 3-4 clear paragraphs for a doctor's quick review:
    Patient: ${JSON.stringify(patient)}
    Recent Records: ${JSON.stringify(records?.slice(0, 5))}
    Focus on: allergies, chronic conditions, recent diagnoses, and key concerns.`;
    const geminiResponse = await callGemini(prompt);
    const summary = geminiResponse || mockRecordSummary(patient);
    res.json({ success: true, data: { summary }, source: geminiResponse ? 'gemini' : 'mock' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/ai/explain-prescription
router.post('/explain-prescription', protect, async (req, res) => {
  try {
    const { medicineName, question } = req.body;
    const prompt = `You are a helpful hospital AI assistant. A patient is asking about their medication "${medicineName}".
    Their question: "${question || 'How should I take this medicine?'}"
    Explain in simple, non-technical language. Include: how to take it, common side effects, and important precautions. Keep it friendly and reassuring.`;
    const geminiResponse = await callGemini(prompt);
    const data = geminiResponse ? { explanation: geminiResponse, disclaimer: 'Always follow your doctor\'s specific instructions.' } : mockPrescriptionExplanation(medicineName);
    res.json({ success: true, data, source: geminiResponse ? 'gemini' : 'mock' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/ai/appointment-assistant
router.post('/appointment-assistant', protect, async (req, res) => {
  try {
    const { query, doctors } = req.body;
    const prompt = `You are a hospital appointment assistant. A patient says: "${query}".
    Available doctors: ${JSON.stringify(doctors?.slice(0, 10))}.
    Suggest the most appropriate 2-3 doctors and time slots. Respond conversationally and helpfully.`;
    const geminiResponse = await callGemini(prompt);
    const data = geminiResponse ? { message: geminiResponse, suggestions: [] } : mockAppointmentSuggestions(query);
    res.json({ success: true, data, source: geminiResponse ? 'gemini' : 'mock' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/ai/operations-insight
router.post('/operations-insight', protect, async (req, res) => {
  try {
    const { query, stats } = req.body;
    const prompt = `You are an AI operations analyst for a hospital. An administrator asks: "${query}".
    Hospital stats: ${JSON.stringify(stats)}.
    Provide detailed insights about hospital performance, potential issues, and actionable recommendations. Be specific and data-driven.`;
    const geminiResponse = await callGemini(prompt);
    const data = geminiResponse ? { insight: geminiResponse, confidence: '92%', dataPoints: 'Live hospital data' } : mockOperationsInsight(query);
    res.json({ success: true, data, source: geminiResponse ? 'gemini' : 'mock' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/ai/chat — General AI chat
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context } = req.body;
    const roleContext = {
      patient: 'You are a friendly hospital AI assistant helping a patient understand their health, appointments, and reports.',
      doctor: 'You are a medical AI assistant helping a doctor with clinical decision support and patient information.',
      hospital_admin: 'You are a hospital operations AI analyst helping the administrator with performance insights.',
      default: 'You are a helpful hospital management system AI assistant.'
    };
    const systemContext = roleContext[context?.role] || roleContext.default;
    const prompt = `${systemContext}\n\nUser message: ${message}\n\nProvide a helpful, professional response.`;
    const geminiResponse = await callGemini(prompt);
    const reply = geminiResponse || `I'm the HMS AI Assistant. I can help you with symptom analysis, appointment scheduling, prescription explanations, and hospital operations insights. How can I assist you today?`;
    res.json({ success: true, data: { reply }, source: geminiResponse ? 'gemini' : 'mock' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
