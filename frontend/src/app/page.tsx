'use client';

import { useState } from 'react';
import DeviceIdDisplay from "@/components/DeviceIdDisplay";
import CameraCapture from "@/components/CameraCapture";
import ProfileForm from "@/components/ProfileForm";
import MatchingQueue from "@/components/MatchingQueue";
import ChatInterface from "@/components/ChatInterface";
import StartScreen from "@/components/StartScreen";

export default function Home() {
  const [step, setStep] = useState<'welcome' | 'verification' | 'profile' | 'matching' | 'chat'>('welcome');
  const [sessionData, setSessionData] = useState<any>(null); // { session_id, partner: ... }

  const handleVerificationSuccess = (detectedGender: string) => {
    setStep('profile');
  };

  const handleProfileComplete = (userPreference: string) => {
    setStep('matching');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#050510]">
      {/* Background Ambient Orbs */}
      <div className="absolute top-0 left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] animate-blob filter mix-blend-screen opacity-50"></div>
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000 filter mix-blend-screen opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] animate-blob animation-delay-4000 filter mix-blend-screen opacity-50"></div>

      <main className="w-full max-w-lg z-10 flex flex-col gap-6 items-center">

        {step === 'welcome' && (
          <StartScreen onStart={() => setStep('verification')} />
        )}

        {step !== 'welcome' && (
          <div className={`w-full backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl shadow-2xl ring-1 ring-white/5 transition-all duration-700 ${step === 'chat' ? 'max-w-2xl' : ''}`}>
            {step === 'verification' && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Identify Yourself</h2>
                  <p className="text-gray-400 text-sm">AI Verification Required</p>
                </div>
                <CameraCapture onCapture={handleVerificationSuccess} />
              </div>
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
        )}

        {step !== 'chat' && step !== 'welcome' && (
          <div className="opacity-50 hover:opacity-80 transition-opacity">
            <DeviceIdDisplay />
          </div>
        )}
      </main>
    </div>
  );
}
