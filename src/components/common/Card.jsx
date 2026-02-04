import { cn } from '../../utils/cn';

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
