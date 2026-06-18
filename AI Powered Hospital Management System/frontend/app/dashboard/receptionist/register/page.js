'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { patientAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function RegisterPatient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successPatient, setSuccessPatient] = useState(null);

  // Form Fields
  // Personal
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Emergency Contact
  const [ecName, setEcName] = useState('');
  const [ecRelation, setEcRelation] = useState('');
  const [ecPhone, setEcPhone] = useState('');

  // Insurance
  const [insProvider, setInsProvider] = useState('');
  const [insPolicyNumber, setInsPolicyNumber] = useState('');
  const [insValidUntil, setInsValidUntil] = useState('');

  // Medical History
  const [allergies, setAllergies] = useState('');
  const [previousDiseases, setPreviousDiseases] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !dob || !gender || !phone) {
      setError('Please fill in all required personal details (Name, Date of Birth, Gender, and Phone).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessPatient(null);

    try {
      const payload = {
        userId: user._id, // satisfies required mongoose schema constraint
        name,
        dob: new Date(dob).toISOString(),
        gender,
        bloodGroup: bloodGroup || null,
        phone,
        email: email || undefined,
        address: {
          street,
          city,
          state,
          pincode
        },
        emergencyContact: {
          name: ecName,
          relation: ecRelation,
          phone: ecPhone
        },
        insurance: {
          provider: insProvider,
          policyNumber: insPolicyNumber,
          validUntil: insValidUntil ? new Date(insValidUntil).toISOString() : undefined
        },
        medicalHistory: {
          allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
          previousDiseases: previousDiseases.split(',').map(s => s.trim()).filter(Boolean),
          currentMedications: currentMedications.split(',').map(s => s.trim()).filter(Boolean).map(med => ({
            name: med,
            dosage: 'As prescribed'
          }))
        }
      };

      const res = await patientAPI.create(payload);
      if (res.success && res.data) {
        setSuccessPatient(res.data);
        // Reset Form
        setName('');
        setDob('');
        setGender('');
        setBloodGroup('');
        setPhone('');
        setEmail('');
        setStreet('');
        setCity('');
        setState('');
        setPincode('');
        setEcName('');
        setEcRelation('');
        setEcPhone('');
        setInsProvider('');
        setInsPolicyNumber('');
        setInsValidUntil('');
        setAllergies('');
        setPreviousDiseases('');
        setCurrentMedications('');
      } else {
        throw new Error('Registration succeeded but returned no patient ID.');
      }
    } catch (err) {
      setError(err.message || 'Failed to register patient profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Patient Registration" subtitle="Register new walk-in patient profiles">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Success Banner */}
        {successPatient && (
          <div 
            className="card" 
            style={{ 
              background: 'rgba(16, 185, 129, 0.15)', 
              borderColor: 'var(--accent)', 
              marginBottom: '24px',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '32px' }}>✅</span>
              <div>
                <h4 style={{ color: 'var(--accent)', marginBottom: '4px' }}>Patient Registered Successfully!</h4>
                <p className="text-sm">
                  Walk-in profile created for <strong>{successPatient.name}</strong>. 
                  Generated Patient ID: <strong style={{ color: 'white', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '4px' }}>{successPatient.patientId}</strong>
                </p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                  <Link href={`/dashboard/receptionist/appointments?book=true`} className="btn btn-primary btn-sm">
                    📅 Book Appointment for {successPatient.name}
                  </Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSuccessPatient(null)}>
                    Register Another Patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="alert-emergency" style={{ marginBottom: '24px' }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* Registration Form Card */}
        <div className="card">
          <div className="card-header" style={{ padding: 0, marginBottom: '24px' }}>
            <div>
              <div className="card-title">📝 Register Walk-in Patient</div>
              <div className="card-subtitle">Please complete the form sections below. Fields with * are required.</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            
            {/* Section 1: Personal Details */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--primary-light)' }}>
                1. Personal Details
              </h5>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select
                      className="form-select"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-select"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                    >
                      <option value="">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Address Details */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--primary-light)' }}>
                2. Residential Address
              </h5>
              
              <div className="form-group">
                <label className="form-label">Street / Area</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 42 MG Road, Flat 3B"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Emergency Contact Details */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--primary-light)' }}>
                3. Emergency Contact Details
              </h5>
              
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jane Doe"
                    value={ecName}
                    onChange={(e) => setEcName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Spouse, Parent"
                    value={ecRelation}
                    onChange={(e) => setEcRelation(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9876543212"
                    value={ecPhone}
                    onChange={(e) => setEcPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Insurance Details */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--primary-light)' }}>
                4. Insurance Details
              </h5>
              
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Provider Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Star Health"
                    value={insProvider}
                    onChange={(e) => setInsProvider(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Policy Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. POL-12345"
                    value={insPolicyNumber}
                    onChange={(e) => setInsPolicyNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Valid Until</label>
                  <input
                    type="date"
                    className="form-input"
                    value={insValidUntil}
                    onChange={(e) => setInsValidUntil(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Medical History */}
            <div style={{ marginBottom: '32px' }}>
              <h5 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--primary-light)' }}>
                5. Medical History Info
              </h5>
              
              <div className="form-group">
                <label className="form-label">Known Allergies (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Penicillin, Peanuts, Pollen"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Previous Diseases (comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Asthma, Hypertension"
                    value={previousDiseases}
                    onChange={(e) => setPreviousDiseases(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Medications (comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Metformin 500mg, Albuterol"
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <Link href="/dashboard/receptionist" className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register Walk-in Patient'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
