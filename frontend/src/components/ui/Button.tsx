import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    className = '',
    variant = 'primary',
    size = 'md',
    children,
    ...props
}) => {
    const baseStyles = "border-[3px] border-black font-bold uppercase tracking-wide transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-black hover:bg-white hover:shadow-hard",
        secondary: "bg-secondary text-white hover:bg-purple-600 hover:shadow-hard",
        accent: "bg-accent text-black hover:bg-cyan-300 hover:shadow-hard",
        outline: "bg-white text-black hover:bg-gray-100 hover:shadow-hard"
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-xl"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
