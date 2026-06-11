import { ChevronDown } from "lucide-react";

export function SelectField({ className = "", children, ...props }) {
    // Logic kiểm tra và bóc tách class w-full của ông giữ nguyên
    const isFullWidth = className.includes("w-full");
    const extraClass = className.replace("w-full", "").trim();

    return (
        <div className={`relative inline-block ${isFullWidth ? "w-full" : ""}`}>
            <select
                {...props}
                className={`appearance-none w-full px-4 py-2 pr-9 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${extraClass ? extraClass : ""
                    }`}
            >
                {children}
            </select>

            {/* Icon mũi tên hướng xuống tùy chỉnh */}
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
    );
}