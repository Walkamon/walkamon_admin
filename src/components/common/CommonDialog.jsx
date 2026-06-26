import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

/**
 * Reusable Dialog Component (Đã bao gồm sẵn style chuẩn của Challenge)
 */
const CommonDialog = ({
  isOpen,
  type = "success",
  title,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  const displayTitle =
    title || (type === "success" ? "Thành công" : "Thất bại");

  // Cấu hình màu sắc chuẩn xác 100% như bên Challenge
  const config = {
    success: {
      iconColor: "#76A084", // Xanh Sage
      iconBg: "rgba(118, 160, 132, 0.12)", // Nền xanh mờ 12%
      btnBg: "#76A084",
    },
    error: {
      iconColor: "#E59A73", // Cam đất / Đỏ gạch
      iconBg: "rgba(229, 154, 115, 0.12)", // Nền cam mờ 12%
      btnBg: "#E59A73",
    },
  };

  const theme = config[type];

  return (
    // Overlay nền đen mờ 50%
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 transition-opacity">
      {/* Container: Nền trắng theo theme, bo góc xl, đổ bóng 2xl */}
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col items-center text-center transform transition-all duration-300 scale-100">
        {/* Vòng tròn chứa Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors"
          style={{ backgroundColor: theme.iconBg, color: theme.iconColor }}
        >
          {type === "success" ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>

        {/* Tiêu đề thông báo */}
        <h3 className="text-xl font-bold mb-2 text-foreground">
          {displayTitle}
        </h3>

        {/* Nội dung thông báo phản hồi từ hệ thống */}
        <p className="text-muted-foreground mb-6">{message}</p>

        {/* Nút bấm hành động (Hover thì làm mờ đi 1 chút cho giống hiệu ứng đổi màu) */}
        <button
          type="button"
          className="w-full py-2.5 px-4 font-medium rounded-lg text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: theme.btnBg }}
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default CommonDialog;
