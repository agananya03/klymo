'use client';

import { useState, useEffect } from 'react';
import CameraCapture from "@/components/CameraCapture";
import ProfileForm from "@/components/ProfileForm";
import MatchingQueue from "@/components/MatchingQueue";
import ChatInterface from "@/components/ChatInterface";
import Dashboard from "@/components/Dashboard";
import AIPartnerForm from "@/components/AIPartnerForm";
import PostChatSummary from "@/components/PostChatSummary";
import { useToast } from "@/components/Toast";
import { generateDeviceId } from "@/utils/device-id";
import { getSocket } from "@/utils/socket";
import ConfettiCanvas from "@/components/ConfettiCanvas";
import { BADGES, loadBadges, saveBadges, loadStats, saveStats, evaluateBadges, KlymoStats } from "@/utils/badges";
import confetti from 'canvas-confetti';

function getMostRecentMondayUTC(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function checkAndResetStreak() {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem('klymo_streak');
  const now = new Date();
  const currentMonday = getMostRecentMondayUTC(now);

  if (!raw) {
    const initial = {
      count: 0,
      weekStart: currentMonday.toISOString(),
      lastChatDate: null
    };
    localStorage.setItem('klymo_streak', JSON.stringify(initial));
    localStorage.setItem('klymo_shown_milestones', JSON.stringify([]));
    return;
  }

  try {
    const streak = JSON.parse(raw);
    const weekStart = new Date(streak.weekStart);
    const lastChatDate = streak.lastChatDate ? new Date(streak.lastChatDate) : null;
    
    let needsReset = false;

    // Reset if we have crossed Monday 00:00 UTC of a new week
    const weekStartMonday = getMostRecentMondayUTC(weekStart);
    if (currentMonday.getTime() !== weekStartMonday.getTime()) {
      needsReset = true;
    }

    // Reset if weekStart is older than 7 days
    if ((now.getTime() - weekStart.getTime()) > 7 * 24 * 60 * 60 * 1000) {
      needsReset = true;
    }

    // Reset if no chatting in 7 days (inactivity check)
    if (lastChatDate && (now.getTime() - lastChatDate.getTime()) > 7 * 24 * 60 * 60 * 1000) {
      needsReset = true;
    }

    if (needsReset) {
      streak.count = 0;
      streak.weekStart = currentMonday.toISOString();
      localStorage.setItem('klymo_streak', JSON.stringify(streak));
      localStorage.setItem('klymo_shown_milestones', JSON.stringify([]));
    }
  } catch (e) {
    console.error("Failed to parse streak", e);
    const initial = {
      count: 0,
      weekStart: currentMonday.toISOString(),
      lastChatDate: null
    };
    localStorage.setItem('klymo_streak', JSON.stringify(initial));
    localStorage.setItem('klymo_shown_milestones', JSON.stringify([]));
  }
}

export default function Home() {
  const [step, setStep] = useState<'dashboard' | 'verification' | 'profile' | 'matching' | 'chat' | 'ai_setup' | 'summary' | null>(null);
  const [summaryData, setSummaryData] = useState<{
    duration: number;
    commonInterest?: string | null;
    messageCount: number;
    sessionId: string;
    partnerNickname: string;
    partnerDeviceId: string;
    action: 'leave' | 'next';
  } | null>(null);
  const [gender, setGender] = useState<string>('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [showFirstChatModal, setShowFirstChatModal] = useState(false);
  const { info } = useToast();

  const fireFirstChatConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#FFEB3B', '#8B3DFF', '#00BCD4', '#FFD700', '#FFFFFF'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 1 },
        colors: colors,
        zIndex: 9999
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        colors: colors,
        zIndex: 9999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  useEffect(() => {
    // 1. Check Verification Status
    const isVerified = localStorage.getItem('klymo_is_verified');
    if (isVerified === 'true') {
      setStep('dashboard');
    } else {
      setStep('verification');
    }

    // 2. Validate and check weekly/inactivity resets
    checkAndResetStreak();

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

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [challengeIcebreaker, setChallengeIcebreaker] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<{ count: number; message: string } | null>(null);
  const [badgesToCelebrate, setBadgesToCelebrate] = useState<string[]>([]);

  // Get active badge details
  const activeBadgeId = badgesToCelebrate[0];
  const activeBadge = activeBadgeId ? BADGES.find(b => b.id === activeBadgeId) : null;

  const dismissCelebration = () => {
    setBadgesToCelebrate(prev => prev.slice(1));
  };

  const checkNewBadges = (updatedStats: KlymoStats) => {
    let streakCount = 0;
    const rawStreak = localStorage.getItem('klymo_streak');
    if (rawStreak) {
      try {
        streakCount = JSON.parse(rawStreak).count || 0;
      } catch (e) {
        console.error(e);
      }
    }

    const currentBadges = loadBadges();
    const evaluated = evaluateBadges(updatedStats, streakCount);
    
    // Find newly earned badges
    const newlyEarned = evaluated.filter(id => !currentBadges.includes(id));
    if (newlyEarned.length > 0) {
      // Update saved badges
      const newBadgesList = [...currentBadges, ...newlyEarned];
      saveBadges(newBadgesList);

      // Add to celebration queue
      setBadgesToCelebrate(prev => [...prev, ...newlyEarned]);
      setShowConfetti(true);
      
      // Clear confetti canvas after 7 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 7000);
    }
  };

  const handleMessageSent = () => {
    const stats = loadStats();
    stats.totalMessages += 1;
    saveStats(stats);
    checkNewBadges(stats);
  };

  const handleReceivedFiveStarRating = () => {
    const stats = loadStats();
    stats.ratingsCountOfFive += 1;
    saveStats(stats);
    checkNewBadges(stats);
  };

  useEffect(() => {
    const socket = getSocket();

    const handlePartnerRatedGlobal = (data: any) => {
      if (data && data.rating === 5) {
        handleReceivedFiveStarRating();
      }
    };

    socket.on('partner_rated', handlePartnerRatedGlobal);

    return () => {
      socket.off('partner_rated', handlePartnerRatedGlobal);
    };
  }, []);

  const handleChatCompleted = (partnerLocale: string | null) => {
    const isFirstChatDone = localStorage.getItem('klymo_first_chat_done') === 'true';
    if (!isFirstChatDone) {
      fireFirstChatConfetti();
      setShowFirstChatModal(true);
      localStorage.setItem('klymo_first_chat_done', 'true');
    }

    let streakCount = 0;
    const raw = localStorage.getItem('klymo_streak');
    if (raw) {
      try {
        const streak = JSON.parse(raw);
        const newCount = (streak.count || 0) + 1;
        streak.count = newCount;
        streak.lastChatDate = new Date().toISOString();
        localStorage.setItem('klymo_streak', JSON.stringify(streak));
        streakCount = newCount;

        // Milestone trigger checking
        const milestones: { [key: number]: string } = {
          3: "You're on a roll! 🔥",
          5: "Halfway to your weekly best!",
          10: "Chat master this week! 🏆",
          20: "Legendary week! 🌟"
        };

        if (milestones[newCount]) {
          const message = milestones[newCount];
          const shownRaw = localStorage.getItem('klymo_shown_milestones');
          const shown: string[] = shownRaw ? JSON.parse(shownRaw) : [];

          if (!shown.includes(newCount.toString())) {
            setActiveMilestone({ count: newCount, message });
            setShowConfetti(true);

            shown.push(newCount.toString());
            localStorage.setItem('klymo_shown_milestones', JSON.stringify(shown));

            // Auto-close overlay after 5 seconds
            setTimeout(() => {
              setActiveMilestone(null);
            }, 5000);

            // Clear confetti canvas after 7 seconds
            setTimeout(() => {
              setShowConfetti(false);
            }, 7000);
          }
        }
      } catch (e) {
        console.error("Failed to process chat completion", e);
      }
    }

    // 2. Stats & Badges logic
    const stats = loadStats();
    stats.totalChats += 1;

    if (challengeIcebreaker) {
      const newProgress = (stats.dailyChallengesCompleted || 0) + 1;
      stats.dailyChallengesCompleted = newProgress;
      info(`DAILY CHALLENGE CHAT COMPLETED! PROGRESS: ${newProgress} / 3 📅`, 5000);
    }

    // Add selected interests from state
    if (selectedInterests && selectedInterests.length > 0) {
      selectedInterests.forEach(interest => {
        if (!stats.chattedInterests.includes(interest)) {
          stats.chattedInterests.push(interest);
        }
      });
    }

    // Region check
    if (partnerLocale) {
      const userLocale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
      const userLang = userLocale.split('-')[0].toLowerCase();
      const partnerLang = partnerLocale.split('-')[0].toLowerCase();
      if (userLang !== partnerLang) {
        stats.hasChattedDifferentRegion = true;
      }
    }

    // Night chat check (between 12 AM and 4 AM local time)
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) {
      stats.hasCompletedNightChat = true;
    }

    saveStats(stats);
    checkNewBadges(stats);
  };

  const handleStartChat = (interests: string[], icebreaker?: string | null) => {
    setSelectedInterests(interests);
    setChallengeIcebreaker(icebreaker || null);
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
              interests={selectedInterests}
              onMatchFound={(data) => {
                setSessionData(data);
                setStep('chat');
              }}
              onCancel={() => {
                setChallengeIcebreaker(null);
                setStep('dashboard');
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
              onLeave={() => {
                setChallengeIcebreaker(null);
                setStep('dashboard');
              }}
              onChatCompleted={handleChatCompleted}
              onMessageSent={handleMessageSent}
              onReceivedFiveStarRating={handleReceivedFiveStarRating}
              initialIcebreaker={challengeIcebreaker}
              onChatEnded={(data) => {
                setSummaryData(data);
                setStep('summary');
              }}
            />
          )}

          {step === 'summary' && summaryData && (
            <PostChatSummary
              duration={summaryData.duration}
              commonInterest={summaryData.commonInterest}
              messageCount={summaryData.messageCount}
              sessionId={summaryData.sessionId}
              partnerNickname={summaryData.partnerNickname}
              partnerDeviceId={summaryData.partnerDeviceId}
              onChatAgain={() => {
                handleStartChat(selectedInterests, challengeIcebreaker);
              }}
              onGoHome={() => {
                setChallengeIcebreaker(null);
                setSummaryData(null);
                setStep('dashboard');
              }}
            />
          )}
        </div>
      </main>

      {/* Custom Weekly Streak Milestone Toast Overlay */}
      {activeMilestone && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
          <div className="bg-yellow-300 text-black border-[3px] border-black p-4 shadow-[6px_6px_0px_0px_#000] font-black uppercase text-center animate-in slide-in-from-bottom-12 duration-300 flex flex-col items-center gap-2 min-w-[300px]">
            <div className="text-3xl animate-bounce">🎉</div>
            <div className="text-sm tracking-widest text-gray-700">MILESTONE REACHED!</div>
            <div className="text-xl leading-none">{activeMilestone.message}</div>
            <div className="text-xs text-gray-600 mt-1">({activeMilestone.count} chats completed this week)</div>
          </div>
        </div>
      )}

      {/* Custom Achievement Badge Celebration Modal Overlay */}
      {activeBadge && !showFirstChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            onClick={dismissCelebration}
            className="w-full max-w-sm bg-yellow-300 border-[4px] border-black p-8 text-center shadow-[8px_8px_0px_0px_#000] cursor-pointer select-none transform rotate-1 animate-in zoom-in duration-300"
          >
            <div className="text-7xl mb-4 animate-bounce duration-700">
              {activeBadge.emoji}
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2 leading-none">
              Badge Unlocked!
            </h2>
            <h3 className="text-xl font-extrabold uppercase bg-black text-white px-3 py-1 inline-block mb-4">
              {activeBadge.name}
            </h3>
            <p className="text-sm font-bold uppercase text-gray-800 leading-tight mb-6">
              {activeBadge.description}
            </p>
            <div className="text-xs font-black uppercase bg-white border-2 border-black py-2.5 shadow-[3px_3px_0px_0px_#000]">
              TAP TO CLAIM 🎉
            </div>
          </div>
        </div>
      )}

      {/* First Chat Celebration Modal Overlay */}
      {showFirstChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in pointer-events-none">
          <div className="w-full max-w-md bg-white border-[4px] border-black p-8 text-center shadow-[8px_8px_0px_0px_#000] rounded-2xl pointer-events-auto transform animate-scale-fade-in">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3 leading-tight">
              You completed your first Klymo chat!
            </h2>
            <p className="text-sm font-bold text-gray-700 uppercase tracking-wide leading-normal mb-6">
              Your journey begins. Keep chatting to earn badges and build your streak.
            </p>
            <button
              onClick={() => setShowFirstChatModal(false)}
              className="w-full py-3.5 bg-primary border-[3px] border-black text-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] cursor-pointer select-none transition-all"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {showConfetti && <ConfettiCanvas />}
    </div>
  );
}
