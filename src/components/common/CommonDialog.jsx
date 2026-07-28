import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

const CommonDialog = ({
  isOpen,
  type = "success",
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const displayTitle = title || (type === "success" ? "Thành công" : "Thất bại");

  const config = {
    success: {
      iconColor: "#76A084",
      iconBg: "rgba(118, 160, 132, 0.12)",
      btnBg: "#76A084",
    },
    error: {
      iconColor: "#E59A73",
      iconBg: "rgba(229, 154, 115, 0.12)",
      btnBg: "#E59A73",
    },
    warning: {
      iconColor: "#E59A73",
      iconBg: "rgba(229, 154, 115, 0.12)",
      btnBg: "#E59A73",
    },
  };

  const theme = config[type] || config.error;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 transition-opacity">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col items-center text-center transform transition-all duration-300 scale-100">
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

        <h3 className="text-xl font-bold mb-2 text-foreground">{displayTitle}</h3>
        <p className="text-muted-foreground mb-6">{message}</p>

        {onConfirm ? (
          <div className="flex w-full gap-3">
            <button
              type="button"
              className="flex-1 py-2.5 px-4 font-medium rounded-lg transition-opacity hover:opacity-90 cursor-pointer bg-muted text-muted-foreground"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 px-4 font-medium rounded-lg text-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: theme.btnBg }}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : confirmLabel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="w-full py-2.5 px-4 font-medium rounded-lg text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: theme.btnBg }}
            onClick={onClose}
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
};

export default CommonDialog;
