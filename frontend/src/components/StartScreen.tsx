import React from 'react';

interface StartScreenProps {
    onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center space-y-10 lg:space-y-16 animate-in fade-in zoom-in duration-1000 min-h-screen w-full px-4 overflow-hidden">

            {/* Hero Text */}
            <div className="text-center space-y-5 lg:space-y-8 relative max-w-full z-10">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full pointer-events-none animate-pulse"></div>

                <h1 className="relative text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter bg-gradient-to-br from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    Klymo
                </h1>

                <div className="space-y-3 lg:space-y-4">
                    <p className="text-lg md:text-xl lg:text-3xl text-indigo-200 font-light tracking-[0.2em] uppercase break-words">
                        Beyond Connections
                    </p>
                    <p className="text-xs lg:text-base text-indigo-300/60 tracking-widest uppercase">
                        Anonymous • Verified • Ephemeral
                    </p>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 w-full max-w-sm md:max-w-3xl lg:max-w-5xl px-0 z-10">
                {[
                    { icon: "🛡️", title: "Anonymous", desc: "No data stored." },
                    { icon: "⚡", title: "Instant", desc: "Zero wait time." },
                    { icon: "🤖", title: "AI Verified", desc: "Real humans only." }
                ].map((feature, i) => (
                    <div
                        key={i}
                        className="bg-white/5 backdrop-blur-md border border-white/10 p-5 lg:p-8 rounded-3xl text-center hover:bg-white/10 transition duration-300 animate-float flex flex-col items-center justify-center w-full"
                        style={{ animationDelay: `${i * 0.2}s` }}
                    >
                        <div className="text-4xl lg:text-5xl mb-3 lg:mb-5">{feature.icon}</div>
                        <h3 className="text-white font-bold text-sm lg:text-lg uppercase whitespace-nowrap">{feature.title}</h3>
                        <p className="text-gray-400 text-xs lg:text-sm mt-2 font-light">{feature.desc}</p>
                    </div>
                ))}
            </div>

            {/* Start Button */}
            <button
                onClick={onStart}
                className="z-10 group relative px-10 lg:px-20 py-5 lg:py-8 bg-white text-black font-bold text-lg lg:text-2xl rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] mt-8 lg:mt-12"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10 group-hover:text-white transition-colors duration-300 tracking-widest uppercase">
                    Enter the Void
                </span>
            </button>

            <div className="absolute bottom-6 lg:bottom-10 text-white/20 text-[10px] lg:text-sm tracking-widest uppercase">
                Secure Connection Established
            </div>
        </div>
    );
}
