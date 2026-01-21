import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-full font-bold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-osia-teal-500/50 disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-osia-teal-500 text-white hover:bg-osia-teal-400 shadow-[0_0_20px_rgba(56,163,165,0.4)] hover:shadow-[0_0_30px_rgba(56,163,165,0.6)] active:scale-95': variant === 'primary',
                        'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-md': variant === 'secondary',
                        'border border-osia-teal-500/20 bg-transparent text-osia-teal-300 hover:bg-osia-teal-500/10 hover:border-osia-teal-500/40': variant === 'outline',
                        'hover:bg-white/5 text-osia-neutral-400 hover:text-white': variant === 'ghost',
                        'h-10 px-6 text-[10px]': size === 'sm',
                        'h-12 px-10 text-xs': size === 'md',
                        'h-14 px-12 text-sm': size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
