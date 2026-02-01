'use client';

import { useState, useEffect } from 'react';
import DeviceIdDisplay from "@/components/DeviceIdDisplay";
import CameraCapture from "@/components/CameraCapture";
import ProfileForm from "@/components/ProfileForm";
import EphemeralChat from "@/components/EphemeralChat";
import { generateDeviceId } from '@/utils/device-id';

export default function Home() {
  const [step, setStep] = useState<'verification' | 'profile' | 'matching' | 'chat'>('verification');
  const [gender, setGender] = useState<string>('');
  const [preference, setPreference] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [matchingStatus, setMatchingStatus] = useState('Initializing...');

  const handleVerificationSuccess = (detectedGender: string) => {
    setGender(detectedGender.toLowerCase());
    setStep('profile');
  };

  const handleProfileComplete = (userPreference: string) => {
    setPreference(userPreference);
    setStep('matching');
  };

  const startMatching = async () => {
    setMatchingStatus('Connecting to Klymo Network...');
    try {
      const deviceId = await generateDeviceId();
      const res = await fetch('/api/v1/chat/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: deviceId,
          gender: gender,
          preference: preference
        })
      });

      const data = await res.json();

      if (data.status === 'matched') {
        setSessionId(data.session_id);
        setStep('chat');
      } else if (data.status === 'queued') {
        setMatchingStatus('Waiting for a partner... (Retrying in 5s)');
        setTimeout(startMatching, 5000); // Simple polling
      } else {
        setMatchingStatus(`Status: ${data.message || 'Unknown'}`);
        if (data.status === 'cooldown') {
          setTimeout(startMatching, (data.wait || 5) * 1000);
        }
      }
    } catch (err) {
      console.error("Matching error", err);
      setMatchingStatus('Connection failed. Retrying...');
      setTimeout(startMatching, 5000);
    }
  };

  // Trigger matching when step becomes 'matching'
  useEffect(() => {
    if (step === 'matching') {
      startMatching();
    }
  }, [step]);

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

          {step === 'matching' && (
            <div className="p-8 border rounded-xl bg-white dark:bg-gray-800 shadow-md text-center animate-pulse">
              <h2 className="text-2xl font-bold text-blue-600 mb-4">Finding Match</h2>
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                {matchingStatus}
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Searching for: {preference === 'any' ? 'Anyone' : preference}
              </p>
            </div>
          )}

          {step === 'chat' && sessionId && (
            <EphemeralChat
              sessionId={sessionId}
              onEnd={() => setStep('profile')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
