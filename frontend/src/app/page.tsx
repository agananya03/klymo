'use client';

import { useState, useEffect } from 'react';
import CameraCapture from "@/components/CameraCapture";
import ProfileForm from "@/components/ProfileForm";
import MatchingQueue from "@/components/MatchingQueue";
import ChatInterface from "@/components/ChatInterface";
import Dashboard from "@/components/Dashboard";
import AIPartnerForm from "@/components/AIPartnerForm";
import { useToast } from "@/components/Toast";
import { generateDeviceId } from "@/utils/device-id";

export default function Home() {
  const [step, setStep] = useState<'dashboard' | 'verification' | 'profile' | 'matching' | 'chat' | 'ai_setup' | null>(null);
  const [gender, setGender] = useState<string>('');
  const [sessionData, setSessionData] = useState<any>(null);
  const { info } = useToast();

  useEffect(() => {
    // 1. Check Verification Status
    const isVerified = localStorage.getItem('klymo_is_verified');
    if (isVerified === 'true') {
      setStep('dashboard');
    } else {
      setStep('verification');
    }

    // 2. Initialize Device ID & notify user if new
    const initIdentity = async () => {
      // Check notification first so it appears instantly
      const hasNotified = localStorage.getItem('klymo_identity_notified_v2');
      if (!hasNotified) {
        info("IDENTITY CREATED: ANONYMOUS DEVICE ID GENERATED", 5000);
        localStorage.setItem('klymo_identity_notified_v2', 'true');
      }

      await generateDeviceId(); // Ensures ID exists in IndexedDB in background
    };
    initIdentity();
  }, [info]);

  const handleStartChat = () => {
    setStep('matching');
  };

  const handleEditProfile = () => {
    setStep('profile');
  };

  const handleVerificationSuccess = (detectedGender: string) => {
    localStorage.setItem('klymo_is_verified', 'true');
    setGender(detectedGender.toLowerCase());
    setStep('profile');
  };

  const handleProfileComplete = (userPreference: string) => {
    setStep('dashboard');
  };

  if (!step) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-16 h-16 border-[6px] border-black border-t-yellow-400 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-sans text-black flex items-center justify-center bg-[url('/grid.svg')] relative">
      <main className="flex flex-col gap-8 items-center w-full max-w-3xl z-10">
        <div className="w-full text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-none" style={{ textShadow: '4px 4px 0px #000' }}>
            WELCOME TO<br />KLYMO CHAT
          </h1>
          <div className="inline-block bg-primary border-[3px] border-black px-4 py-2 text-sm md:text-base font-bold uppercase transform -rotate-1 shadow-[4px_4px_0px_0px_#000]">
            The Secure, Anonymous Connection Platform
          </div>
        </div>

        <div className="w-full transition-all duration-500 relative">
          {step === 'dashboard' && (
            <Dashboard
              onStartChat={handleStartChat}
              onEditProfile={handleEditProfile}
              onAI={() => setStep('ai_setup')}
            />
          )}

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

          {step === 'ai_setup' && (
            <AIPartnerForm
              onBack={() => setStep('dashboard')}
              onMatchFound={(data) => {
                setSessionData(data);
                setStep('chat');
              }}
            />
          )}

          {step === 'chat' && sessionData && (
            <ChatInterface
              sessionData={sessionData}
              onLeave={() => setStep('dashboard')}
              onNext={() => setStep('matching')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
