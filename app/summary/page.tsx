'use client';

import { useState } from 'react';
import Link from 'next/link';

const ConsultationSummary = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleSendEmail = () => {
        alert('Report sent to your email!');
    };

    return (
        <div className="min-h-screen w-screen bg-gray-50 p-6 flex flex-col items-center">
            {/* User Menu */}
            <div className="absolute top-4 right-4">
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-full hover:bg-gray-300 transition-colors"
                    >
                        <span className="w-10 h-10 text-gray-900 text-5xl">👤</span>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                            <Link href="../edit-profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">User Profile</Link>
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Section */}
            <div className="bg-white shadow-xl rounded-lg p-6 max-w-3xl w-full mt-10 text-center">
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">Consultation Summary</h2>
                <div className="text-left space-y-4">
                    <p><strong>Symptoms:</strong> Connect this</p>
                    <p><strong>Diagnosis:</strong> Connect this too</p>
                    <p><strong>Precautions:</strong> Connect this tooooooo</p>
                </div>

                {/* Buttons */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={handleSendEmail}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Send Report to Email
                    </button>
                    <Link href="../choose-doctor" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                        Start New Consultation
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ConsultationSummary;
