import { cn } from '../../utils/cn'; // Assuming utils/cn exists or I'll create it. Or just use clsx directly if no util.
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Card({ children, className, title, action }) {
    return (
        <div className={cn("bg-white border border-gray-100 rounded-xl shadow-sm p-6 overflow-hidden", className)}>
            {(title || action) && (
                <div className="flex justify-between items-center mb-4">
                    {title && <h3 className="font-bold text-gray-800 text-lg">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
