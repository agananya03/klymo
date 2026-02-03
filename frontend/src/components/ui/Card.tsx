import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'white' | 'primary' | 'secondary' | 'accent';
}

export const Card: React.FC<CardProps> = ({
    className = '',
    variant = 'white',
    children,
    ...props
}) => {
    const variants = {
        white: "bg-white",
        primary: "bg-primary",
        secondary: "bg-secondary text-white",
        accent: "bg-accent"
    };

    return (
        <div
            className={`border-[3px] border-black shadow-hard p-6 ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
