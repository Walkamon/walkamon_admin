import { Calendar } from "lucide-react";

/**
 * Component Chọn Ngày Giờ phẳng đồng bộ hệ thống
 * @param {string} value - Giá trị ngày giờ (YYYY-MM-DDTHH:mm)
 * @param {function} onChange - Hàm bắt sự kiện thay đổi
 * @param {boolean} required - Trường bắt buộc hay không
 * @param {string} className - Class tùy biến bên ngoài
 */
export default function CustomDatePicker({
  value,
  onChange,
  required = false,
  className = "",
}) {
  return (
    <div
      className={`group-calendar relative flex items-center w-full ${className}`}
    >
      <input
        type="datetime-local"
        required={required}
        value={value}
        onChange={onChange}
        className="w-full text-sm focus:outline-none text-foreground relative z-10"
      />
      {/* Icon Lucide đặt sát bên phải tương đồng vị trí mũi tên dropdown */}
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80 pointer-events-none z-30" />
    </div>
  );
}
