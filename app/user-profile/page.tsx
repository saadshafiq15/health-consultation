'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';
import {useRouter} from 'next/router';

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
  const [currentStep, setCurrentStep] = useState(1); // Manage the step of the form
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
      setTimeout(() => {
        window.location.href = 'http://localhost:3000'; // Redirect to the landing page
      }, 1500); 
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return formData.name.trim() !== '' && formData.age.trim() !== '';
    }
    if (step === 2) {
      return formData.height.trim() !== '' && formData.weight.trim() !== '';
    }
    if (step === 3) {
      return formData.emergency_contact_name.trim() !== '' && formData.emergency_contact_number.trim() !== '';
    }
    if (step === 4) {
      // Check if at least one prescription is filled out
      return formData.prescriptions.every(prescription => prescription.name.trim() !== '');
    }
    if (step === 5) {
      return formData.history.trim() !== '';
    }
    if (step === 6) {
      return consentGiven;
    }
    return true;
  };

  const goToDashboard = () => {
    router.push('/dashboard'); // Navigate to dashboard
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-lg w-full">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">User Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {currentStep === 1 && (
            <>
              <div>
                <label className="block text-gray-700 font-medium">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
                  required
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div>
                <label className="block text-gray-700 font-medium">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
                  required
                />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div>
                <label className="block text-gray-700 font-medium">Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Emergency Contact Phone</label>
                <input
                  type="number"
                  name="emergency_contact_number"
                  value={formData.emergency_contact_number}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
                  required
                />
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
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
            </>
          )}

          {currentStep === 5 && (
            <>
              <div>
                <label className="block text-gray-700 font-medium">Medical History</label>
                <textarea
                  name="history"
                  value={formData.history}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300 h-24"
                  placeholder="Enter medical history or type 'N/A' if none"
                />
              </div>
              <div className="text-sm text-gray-500 mt-2">
                <p>If none, enter <span className="font-medium">N/A</span>.</p>
              </div>
            </>
          )}

          {currentStep === 6 && (
            <>
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
            </>
          )}

          <div className="flex justify-between items-center mt-5">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="text-blue-600 hover:text-blue-700">
                Back
              </button>
            )}
            <div>
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={`w-full font-semibold p-3 rounded-lg transition ${!validateStep(currentStep) || loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  disabled={!validateStep(currentStep) || loading}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className={`w-full font-semibold p-3 rounded-lg transition ${!consentGiven || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  disabled={!consentGiven || loading}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      
    </div>
  );
}
