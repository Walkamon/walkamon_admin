import { Search } from "lucide-react";

export function SearchFilter({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary ${inputClassName}`}
        {...props}
      />
    </div>
  );
}
