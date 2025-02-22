'use client';

import { useState } from 'react';
import Link from 'next/link';

const DoctorSelection = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const doctorTypes = [
    {
      type: 'Family Doctor',
      description: 'General health consultations and primary care.',
      icon: '👨‍⚕️',
      path: '/consultation/doctor',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700'
    },
    {
      type: 'Therapist',
      description: 'Mental health support and therapy sessions.',
      icon: '🧠',
      path: '/consultation/therapist',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700'
    }
  ];

  const handleLogout = () => {
    // Add your logout logic here
    console.log('User logged out');
    setShowLogoutDialog(false);
  };

  return (
    <div className="min-h-screen w-screen bg-gray-50">
      {/* User Menu */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-gray-300 transition-colors"
          >
            <span className="w-10 h-10 text-gray-900 text-5xl">👤</span>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link
                href="../edit-profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                User Profile
              </Link>
              <button
                onClick={() => {
                  setShowLogoutDialog(true);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-20 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Confirm Logout</h2>
            <p>Are you sure you want to logout? Your session will be ended.</p>
            <div className="mt-4 flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Stay
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-screen w-screen flex flex-col items-center justify-center">
        {/* Header */}
        <h2 className="text-5xl font-semibold text-gray-900 mb-10 tracking-wide">
          Choose Your Healthcare Provider
        </h2>

        {/* Tab Container */}
        <div className="flex w-full max-w-5xl h-[70vh] gap-6 px-6">
          {doctorTypes.map((doctor) => (
            <Link
              key={doctor.type}
              href={doctor.path}
              className={`${doctor.bgColor} ${doctor.hoverColor} flex-1 flex flex-col items-center justify-center text-white text-2xl font-medium rounded-xl shadow-xl transition-transform transform hover:scale-105`}
            >
              <span className="text-7xl mb-5">{doctor.icon}</span>
              <h3 className="text-3xl font-semibold">{doctor.type}</h3>
              <p className="text-white text-lg mt-3 px-8 text-center leading-relaxed">
                {doctor.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorSelection;
