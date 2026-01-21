import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    as?: 'input' | 'textarea';
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
    ({ className, as = 'input', ...props }, ref) => {
        if (as === 'textarea') {
            return (
                <textarea
                    ref={ref as React.Ref<HTMLTextAreaElement>}
                    className={cn(
                        'flex min-h-[100px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white transition-all placeholder:text-osia-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-osia-teal-500/50 disabled:cursor-not-allowed disabled:opacity-50',
                        className
                    )}
                    {...props as any}
                />
            );
        }
        return (
            <input
                ref={ref as React.Ref<HTMLInputElement>}
                className={cn(
                    'flex h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-osia-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-osia-teal-500/50 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';
