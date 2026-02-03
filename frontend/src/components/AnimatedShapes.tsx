import React from 'react';

export default function AnimatedShapes() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Yellow Circle Top-Left */}
            <div className="absolute w-64 h-64 bg-[#FFEB3B] rounded-full border-[3px] border-black opacity-60 shadow-[4px_4px_0px_0px_#000] -top-10 -left-10 animate-float"
                style={{ animationDuration: '25s' }} />

            {/* Purple Square Top-Right */}
            <div className="absolute w-56 h-56 bg-[#8B3DFF] border-[3px] border-black opacity-60 shadow-[4px_4px_0px_0px_#000] top-20 right-20 animate-float"
                style={{ animationDelay: '2s', animationDuration: '30s', transform: 'rotate(15deg)' }} />

            {/* Cyan Circle Right */}
            <div className="absolute w-48 h-48 bg-[#00BCD4] rounded-full border-[3px] border-black opacity-60 shadow-[4px_4px_0px_0px_#000] top-1/3 -right-10 animate-float"
                style={{ animationDelay: '4s', animationDuration: '22s' }} />

            {/* Coral Rect Bottom-Left */}
            <div className="absolute w-72 h-24 bg-[#FF6B5B] border-[3px] border-black opacity-60 shadow-[4px_4px_0px_0px_#000] bottom-40 -left-10 animate-float"
                style={{ animationDelay: '1s', animationDuration: '28s', transform: 'rotate(-10deg)' }} />

            {/* Yellow Square Bottom-Right */}
            <div className="absolute w-40 h-40 bg-[#FFEB3B] border-[3px] border-black opacity-60 shadow-[4px_4px_0px_0px_#000] -bottom-10 right-32 animate-float"
                style={{ animationDelay: '3s', animationDuration: '24s', transform: 'rotate(45deg)' }} />

            {/* Teal Square Middle-Left */}
            <div className="absolute w-24 h-24 bg-[#00BCD4] border-[3px] border-black opacity-60 shadow-[4px_4px_0px_0px_#000] top-1/4 left-20 animate-float"
                style={{ animationDelay: '5s', animationDuration: '20s', transform: 'rotate(15deg)' }} />

            {/* Rotating Elements */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[2px] border-black rounded-full opacity-5 pointer-events-none animate-[spin_60s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[2px] border-black rounded-full opacity-5 pointer-events-none animate-[spin_40s_linear_infinite_reverse]" />
        </div>
    );
}
