'use client';

export const dynamic = "force-dynamic";
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Prescription {
    name: string;
    frequency: string;
}

interface Consultation {
    id: string;
    description: string;
    diagnosis: string;
    precautions: string;
    timestamp?: any; // for sorting consultations
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
    consultationHistory: Consultation[];
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

const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

export default function UserProfilePage() {
    const [user] = useAuthState(auth);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        age: '',
        height: '',
        weight: '',
        prescriptions: [],
        history: '',
        emergency_contact_name: '',
        emergency_contact_number: '',
        consultationHistory: []
    });
    const [expandedConsultations, setExpandedConsultations] = useState<string[]>([]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return;

            try {
                // Fetch profile data
                const profileDocRef = doc(db, "users", user.uid, "data", "profile");
                const profileDoc = await getDoc(profileDocRef);

                // Fetch consultations
                const consultationsRef = collection(db, "users", user.uid, "consultations");
                const consultationsSnapshot = await getDocs(consultationsRef);
                
                const consultations: Consultation[] = [];
                consultationsSnapshot.forEach((doc) => {
                    consultations.push({
                        //@ts-expect-error
                        id: doc.id,
                        ...doc.data() as Consultation
                    });
                });

                // Sort consultations by timestamp if available
                const sortedConsultations = consultations.sort((a, b) => 
                    b.timestamp?.toDate() - a.timestamp?.toDate()
                );

                if (profileDoc.exists()) {
                    const data = profileDoc.data();
                    setFormData({
                        ...formData,
                        ...data,
                        prescriptions: data.prescriptions || [],
                        consultationHistory: sortedConsultations
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load profile data');
            }
        };

        fetchUserProfile();
    }, [user]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prevData) => {
            const newData = { ...prevData };
            //@ts-expect-error
            newData[field] = value;
            return newData;
        });
    };

    const handlePrescriptionChange = (index: number, field: 'name' | 'frequency', value: string) => {
        setFormData((prevData) => {
            const newPrescriptions = [...prevData.prescriptions];
            newPrescriptions[index] = {
                ...newPrescriptions[index],
                [field]: value
            };
            return {
                ...prevData,
                prescriptions: newPrescriptions
            };
        });
    };

    const addPrescription = () => {
        setFormData(prev => ({
            ...prev,
            prescriptions: [...prev.prescriptions, { name: '', frequency: 'Once daily' }]
        }));
    };

    const removePrescription = (index: number) => {
        setFormData(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            const profileDocRef = doc(db, "users", user.uid, "data", "profile");
            
            // Create a clean copy of the data to update
            const updateData = {
                name: formData.name,
                age: formData.age,
                height: formData.height,
                weight: formData.weight,
                prescriptions: formData.prescriptions,
                history: formData.history,
                emergency_contact_name: formData.emergency_contact_name,
                emergency_contact_number: formData.emergency_contact_number
                // Deliberately exclude consultationHistory to prevent updates
            };

            await updateDoc(profileDocRef, updateData);
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleConsultation = (id: string) => {
        setExpandedConsultations(prev => 
            prev.includes(id) 
                ? prev.filter(consultId => consultId !== id)
                : [...prev, id]
        );
    };

    const ViewModeField = ({ label, value }: { label: string; value: string }) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">{value || 'Not provided'}</div>
        </div>
    );

    const EditModeField = ({ label, value, onChange, type = "text" }: { 
        label: string; 
        value: string; 
        onChange: (value: string) => void;
        type?: string;
    }) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                defaultValue={value || ''}
                onBlur={(e) => onChange(e.target.value)}
                className="w-full p-3 bg-white rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <div className="w-full bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link
                        href="./../choose-doctor"
                        className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 font-medium"
                    >
                        ← Return to Consultation
                    </Link>
                    {isEditing ? (
                        <div className="space-x-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">User Profile</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Personal Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isEditing ? (
                                    <>
                                        <EditModeField 
                                            label="Full Name" 
                                            value={formData.name} 
                                            onChange={(value) => handleInputChange('name', value)} 
                                        />
                                        <EditModeField 
                                            label="Age" 
                                            value={formData.age} 
                                            onChange={(value) => handleInputChange('age', value)}
                                            type="number"
                                        />
                                        <EditModeField 
                                            label="Height (cm)" 
                                            value={formData.height} 
                                            onChange={(value) => handleInputChange('height', value)}
                                            type="number"
                                        />
                                        <EditModeField 
                                            label="Weight (kg)" 
                                            value={formData.weight} 
                                            onChange={(value) => handleInputChange('weight', value)}
                                            type="number"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <ViewModeField label="Full Name" value={formData.name} />
                                        <ViewModeField label="Age" value={formData.age} />
                                        <ViewModeField label="Height (cm)" value={formData.height} />
                                        <ViewModeField label="Weight (kg)" value={formData.weight} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isEditing ? (
                                    <>
                                        <EditModeField 
                                            label="Name" 
                                            value={formData.emergency_contact_name} 
                                            onChange={(value) => handleInputChange('emergency_contact_name', value)} 
                                        />
                                        <EditModeField 
                                            label="Phone" 
                                            value={formData.emergency_contact_number} 
                                            onChange={(value) => handleInputChange('emergency_contact_number', value)} 
                                        />
                                    </>
                                ) : (
                                    <>
                                        <ViewModeField label="Name" value={formData.emergency_contact_name} />
                                        <ViewModeField label="Phone" value={formData.emergency_contact_number} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Medical History */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
                            {isEditing ? (
                                <textarea
                                    value={formData.history || ''}
                                    onChange={(e) => handleInputChange('history', e.target.value)}
                                    className="w-full p-3 bg-white rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[150px]"
                                />
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap">
                                    {formData.history || 'No medical history provided'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Prescriptions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Prescriptions</h3>
                            <div className="space-y-3">
                                {formData.prescriptions?.map((prescription, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={prescription.name}
                                                    onChange={(e) => handlePrescriptionChange(index, 'name', e.target.value)}
                                                    placeholder="Medication name"
                                                    className="w-full p-2 border rounded"
                                                />
                                                <select
                                                    value={prescription.frequency}
                                                    onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                >
                                                    {FREQUENCY_OPTIONS.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => removePrescription(index)}
                                                    className="text-red-600 hover:text-red-700 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="font-medium text-gray-900">{prescription.name || 'No medication name'}</div>
                                                <div className="text-sm text-gray-600">{prescription.frequency}</div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {isEditing && (
                                    <button
                                        onClick={addPrescription}
                                        className="w-full p-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition"
                                    >
                                        + Add Prescription
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Consultation History */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation History</h3>
                            <div className="space-y-4">
                                {formData.consultationHistory?.map((consultation, index) => (
                                    <div 
                                        key={consultation.id} 
                                        className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleConsultation(consultation.id)}
                                            className="w-full p-4 flex justify-between items-center hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">
                                                Consultation History {index + 1}
                                            </div>
                                            <svg
                                                className={`w-5 h-5 transform transition-transform duration-200 ${
                                                    expandedConsultations.includes(consultation.id) ? 'rotate-90' : ''
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>
                                        <div
                                            className={`transition-all duration-200 ease-in-out ${
                                                expandedConsultations.includes(consultation.id)
                                                    ? 'max-h-[500px] opacity-100'
                                                    : 'max-h-0 opacity-0'
                                            } overflow-hidden`}
                                        >
                                            <div className="p-4 space-y-2 text-sm text-gray-600 border-t border-gray-200">
                                                <div className="text-xs text-gray-500 mb-2">
                                                    {formatDate(consultation.timestamp)}
                                                </div>
                                                <div className="whitespace-pre-wrap">
                                                    <span className="font-medium">Description: </span>
                                                    {consultation.description}
                                                </div>
                                                <div className="whitespace-pre-wrap">
                                                    <span className="font-medium">Diagnosis: </span>
                                                    {consultation.diagnosis}
                                                </div>
                                                <div className="whitespace-pre-wrap">
                                                    <span className="font-medium">Precautions: </span>
                                                    {consultation.precautions}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!formData.consultationHistory || formData.consultationHistory.length === 0) && (
                                    <div className="text-gray-500 text-center py-4">
                                        No consultation history available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}