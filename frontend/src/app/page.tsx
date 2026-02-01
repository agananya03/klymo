'use client';

import { useState } from 'react';
import DeviceIdDisplay from "@/components/DeviceIdDisplay";
import CameraCapture from "@/components/CameraCapture";
import ProfileForm from "@/components/ProfileForm";
import MatchingQueue from "@/components/MatchingQueue";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [step, setStep] = useState<'verification' | 'profile' | 'chat'>('verification');
  const [chatSession, setChatSession] = useState<any>(null); // To store session data

  // Callback when CameraCapture successfully verifies
  const handleVerificationSuccess = () => {
    setStep('profile');
  };

  // Callback when Profile is saved
  // Callback when Profile is saved
  const handleProfileComplete = () => {
    console.log("Setting step to chat");
    setStep('chat');
  };

  const handleMatchFound = (sessionData: any) => {
    setChatSession(sessionData);
  };

  const handleLeaveChat = () => {
    setChatSession(null);
    // Let's reset to queue (chat step, no session).
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
            <>
              {!chatSession ? (
                <MatchingQueue onMatchFound={handleMatchFound} />
              ) : (
                <ChatInterface
                  sessionData={chatSession}
                  onLeave={handleLeaveChat}
                  onNext={() => setChatSession(null)}
                />
              )}

              {!chatSession && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setStep('profile')}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Back to Profile
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer can be simplified or removed */}
    </div>
  );
}
