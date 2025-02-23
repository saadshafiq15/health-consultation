'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

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

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return;

            try {
                const profileDocRef = doc(db, "users", user.uid, "data", "profile");
                const profileDoc = await getDoc(profileDocRef);

                if (profileDoc.exists()) {
                    setFormData(profileDoc.data() as FormData);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load profile data');
            }
        };

        fetchUserProfile();
    }, [user]);

    const ViewModeField = ({ label, value }: { label: string; value: string }) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">{value || 'Not provided'}</div>
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
                    <Link
                        href="/user-profile"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Edit Profile
                    </Link>
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
                                <ViewModeField label="Full Name" value={formData.name} />
                                <ViewModeField label="Age" value={formData.age} />
                                <ViewModeField label="Height (cm)" value={formData.height} />
                                <ViewModeField label="Weight (kg)" value={formData.weight} />
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ViewModeField label="Name" value={formData.emergency_contact_name} />
                                <ViewModeField label="Phone" value={formData.emergency_contact_number} />
                            </div>
                        </div>

                        {/* Medical History */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
                            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap">
                                {formData.history || 'No medical history provided'}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Prescriptions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Prescriptions</h3>
                            <div className="space-y-3">
                                {formData.prescriptions.map((prescription, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                        <div className="font-medium text-gray-900">{prescription.name || 'No medication name'}</div>
                                        <div className="text-sm text-gray-600">{prescription.frequency}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Consultation History */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation History</h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="font-medium text-gray-900">Consultation 1</div>
                                    <div className="text-sm text-gray-600">Details...</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="font-medium text-gray-900">Consultation 2</div>
                                    <div className="text-sm text-gray-600">Details...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}