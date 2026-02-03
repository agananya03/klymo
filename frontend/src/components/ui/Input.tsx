import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({
    className = '',
    label,
    id,
    ...props
}) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && (
                <label htmlFor={id} className="font-bold uppercase tracking-tight text-sm">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`border-[3px] border-black p-3 bg-white font-bold focus:outline-none focus:shadow-hard transition-all placeholder:text-gray-500 disabled:bg-gray-200 ${className}`}
                {...props}
            />
        </div>
    );
};
