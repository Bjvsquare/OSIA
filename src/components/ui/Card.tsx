import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'rounded-2xl border border-white/10 bg-[#0a1128]/40 backdrop-blur-xl shadow-2xl p-6 transition-all duration-300 hover:border-osia-teal-500/30 glass-glow',
                className
            )}
            {...props}
        />
    )
);
Card.displayName = 'Card';
