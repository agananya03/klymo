'use client';

import { useState } from 'react';
import DeviceIdDisplay from "@/components/DeviceIdDisplay";
import CameraCapture from "@/components/CameraCapture";
import ProfileForm from "@/components/ProfileForm";
import MatchingQueue from "@/components/MatchingQueue";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [step, setStep] = useState<'verification' | 'profile' | 'matching' | 'chat'>('verification');
  const [gender, setGender] = useState<string>('');
  // preference not strictly needed in state if handled by MatchingQueue, but ProfileForm passes it back
  const [sessionData, setSessionData] = useState<any>(null); // { session_id, partner: ... }

  const handleVerificationSuccess = (detectedGender: string) => {
    setGender(detectedGender.toLowerCase());
    setStep('profile');
  };

  const handleProfileComplete = (userPreference: string) => {
    // We can pass preference to MatchingQueue if needed, or let user select there.
    // Current flow: ProfileForm -> Matching.
    setStep('matching');
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

          {step === 'matching' && (
            <MatchingQueue
              onMatchFound={(data) => {
                setSessionData(data);
                setStep('chat');
              }}
            />
          )}

          {step === 'chat' && sessionData && (
            <ChatInterface
              sessionData={sessionData}
              onLeave={() => setStep('profile')}
              onNext={() => setStep('matching')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
