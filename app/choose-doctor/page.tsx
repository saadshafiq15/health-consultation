'use client';

import Link from 'next/link';

const DoctorSelection = () => {
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

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
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
  );
};

export default DoctorSelection;
