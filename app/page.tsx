'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import toast from 'react-hot-toast';
import Image from 'next/image'; // Import Image component from Next.js


export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-xl font-bold text-indigo-600">AI Doctor Consultation</div>
            <div>
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">{user.displayName || user.email.split('@')[0]}</span> {/* Display user's name or part of email */}
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <button
                    onClick={() => router.push('/sign-in')}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-100"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/sign-up')}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Your AI-Powered Doctor at Your Fingertips</h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Get instant medical advice from our advanced AI doctor. Available 24/7 to answer your health concerns and provide guidance.
        </p>
        {user ? (
          <div className="mt-6">
            <button
              onClick={() => router.push('/ai')}
              className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Start Consultation
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <button
              onClick={() => router.push('/sign-up')}
              className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Get Started
            </button>
          </div>
        )}
      </main>

      <div className="mt-12 flex flex-col md:flex-row items-center md:justify-center">
        <div className="md:w-1/2 text-left">
          <h2 className="text-3xl font-bold text-indigo-600 mb-6">Breaking Barriers in Canadian Healthcare</h2>
          <p className="text-lg text-gray-700 max-w-3xl">
            Long wait times in hospitals and the difficulty of securing timely appointments with family doctors are common challenges in Canada.
            Our AI Doctor app provides a seamless solution by offering immediate consultations, reducing unnecessary ER visits, and ensuring you get the right medical guidance when you need it most.
          </p>
        </div>
        <div className="mt-6 md:mt-0 flex justify-center">
          <img src="/image/healthcare_solution.png" alt="AI healthcare solution" className="rounded-lg shadow-lg w-full max-w-md" />
        </div>
      </div>

      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-indigo-600 mb-6">What Our Users Say</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-100 p-6 rounded-lg shadow">
              <p className="text-gray-700 italic">"The AI doctor helped me understand my symptoms in minutes! Highly recommend!"</p>
              <p className="mt-4 font-semibold">- Sarah L.</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow">
              <p className="text-gray-700 italic">"Fast and reliable. The advice was surprisingly accurate and helpful."</p>
              <p className="mt-4 font-semibold">- James T.</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow">
              <p className="text-gray-700 italic">"A great tool for initial consultations before seeing a doctor."</p>
              <p className="mt-4 font-semibold">- Emily R.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
