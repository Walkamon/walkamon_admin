import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomSelect({
  value,
  onChange,
  options = [],
  valueKey = "id",
  labelKey = "label",
  placeholder = "Chọn...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt[valueKey] === value);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside() {
      setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    // Thêm class relative và padding-right để chữ không đè lên mũi tên khi sát biên
    <div
      className={`relative ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="item-select-btn w-full text-left pl-3.5 pr-7 py-2 bg-input-background border border-border rounded-lg text-sm flex items-center justify-between text-foreground"
      >
        <span className="truncate">
          {selected ? selected[labelKey] : placeholder}
        </span>
        {/* Đã đổi sang absolute và đặt right-2 để nhích sát lề phải hơn */}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/70 transition-transform shrink-0 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-lg p-1 space-y-0.5">
          {options.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground text-center">
              Không có dữ liệu
            </li>
          ) : (
            options.map((opt) => (
              <li key={opt[valueKey]}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt[valueKey]);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors truncate ${
                    opt[valueKey] === value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {opt[labelKey]}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
