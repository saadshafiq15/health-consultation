'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';

interface Prescription {
  name: string;
  frequency: string;
}

interface FormData {
  name: string;
  age: string;
  height: string;
  weight: string;
  prescriptions: Prescription[];
  history: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
}

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every morning',
  'Every night',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Weekly',
  'Monthly',
  'None'
];

export default function UserProfilePage() {
  const [user] = useAuthState(auth);
  
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: '',
    height: '',
    weight: '',
    prescriptions: [{ name: '', frequency: 'Once daily' }],
    history: '',
    emergency_contact_name: '',
    emergency_contact_number: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePrescriptionChange = (index: number, field: keyof Prescription, value: string) => {
    const newPrescriptions = [...formData.prescriptions];
    newPrescriptions[index] = {
      ...newPrescriptions[index],
      [field]: value
    };
    setFormData({ ...formData, prescriptions: newPrescriptions });
  };

  const addPrescription = () => {
    setFormData({
      ...formData,
      prescriptions: [...formData.prescriptions, { name: '', frequency: 'Once daily' }]
    });
  };

  const removePrescription = (index: number) => {
    const newPrescriptions = formData.prescriptions.filter((_, i) => i !== index);
    setFormData({ ...formData, prescriptions: newPrescriptions });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!consentGiven) {
      toast.error("You must agree to the terms before saving your profile.");
      return;
    }

    setLoading(true);

    // Required fields validation
    const requiredFields = ['name', 'age', 'height', 'weight', 'emergency_contact_name', 'emergency_contact_number'];
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast.error(`${field.replace('_', ' ')} is required`);
        setLoading(false);
        return;
      }
    }

    if (!user) {
      toast.error('You need to be logged in to save your profile.');
      setLoading(false);
      return;
    }

    try {
      const profileDocRef = doc(db, "users", user.uid, "data", "profile");
      
      // Filter out empty prescriptions before saving
      const dataToSave = {
        ...formData,
        prescriptions: formData.prescriptions.filter(p => p.name.trim() !== '')
      };
      
      await setDoc(profileDocRef, dataToSave);
      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-lg w-full">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">User Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: 'Full Name', name: 'name', type: 'text', required: true },
            { label: 'Age', name: 'age', type: 'number', required: true },
            { label: 'Height (cm)', name: 'height', type: 'number', required: true },
            { label: 'Weight (kg)', name: 'weight', type: 'number', required: true },
            { label: 'Emergency Contact Name', name: 'emergency_contact_name', type: 'text', required: true },
            { label: 'Emergency Contact Phone', name: 'emergency_contact_number', type: 'number', required: true },
          ].map(({ label, name, type, required }) => (
            <div key={name}>
              <label className="block text-gray-700 font-medium">{label}{required && ' *'}</label>
              <input
                type={type}
                name={name}
                value={formData[name as keyof FormData]}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
                required={required}
              />
            </div>
          ))}

          {/* Prescriptions Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-gray-700 font-medium">Ongoing Prescriptions</label>
              <button
                type="button"
                onClick={addPrescription}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <span className="text-xl mr-1">+</span> Add Prescription
              </button>
            </div>
            
            {formData.prescriptions.map((prescription, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between">
                  <label className="block text-sm text-gray-600">Prescription #{index + 1}</label>
                  {index >= 0 && (
                    <button
                      type="button"
                      onClick={() => removePrescription(index)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={prescription.name}
                  onChange={(e) => handlePrescriptionChange(index, 'name', e.target.value)}
                  placeholder="Name of medication"
                  className="w-full p-2 border rounded-md"
                />
                <select
                  value={prescription.frequency}
                  onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  {FREQUENCY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-gray-700 font-medium">Medical History</label>
            <textarea
              name="history"
              value={formData.history}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300 h-24"
            />
          </div>

          {/* Disclaimer Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="consentCheckbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-300"
            />
            <label htmlFor="consentCheckbox" className="text-gray-700 text-sm">
              I consent to providing this information for the purpose of assisting in health condition assessments.
            </label>
          </div>

          <button
            type="submit"
            className={`w-full font-semibold p-3 rounded-lg transition ${
              !consentGiven || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={!consentGiven || loading}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}