'use client';

import { useState } from 'react';
import DeviceIdDisplay from "@/components/DeviceIdDisplay";
import CameraCapture from "@/components/CameraCapture";
import ProfileForm from "@/components/ProfileForm";

export default function Home() {
  const [step, setStep] = useState<'verification' | 'profile' | 'chat'>('verification');

  // Callback when CameraCapture successfully verifies
  const handleVerificationSuccess = () => {
    setStep('profile');
  };

  // Callback when Profile is saved
  const handleProfileComplete = () => {
    setStep('chat');
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-lg">
        <div className="w-full text-center sm:text-left">
          <h1 className="text-3xl font-bold mb-2">Klymo</h1>
          <DeviceIdDisplay />
        </div>

        <div className="w-full transition-all duration-500">
          {step === 'verification' && (
            <CameraCapture onCapture={handleVerificationSuccess} />
          )}

          {step === 'profile' && (
            <ProfileForm onProfileComplete={handleProfileComplete} />
          )}

          {step === 'chat' && (
            <div className="p-8 border rounded-xl bg-white dark:bg-gray-800 shadow-md text-center animate-in fade-in zoom-in duration-500">
              <h2 className="text-2xl font-bold text-green-600 mb-4">You are ready!</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Profile setup complete. <br />
                (Chat interface coming soon...)
              </p>
              <button
                onClick={() => setStep('profile')}
                className="mt-6 text-sm text-blue-500 hover:underline"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer can be simplified or removed */}
    </div>
  );
}
