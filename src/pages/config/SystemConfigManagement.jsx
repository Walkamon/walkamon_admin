import React, { useState, useEffect, useCallback } from "react";
import { Save, Lightbulb, Sprout, Loader2, Footprints } from "lucide-react";
import { getStepExpRate, updateStepExpRate } from "../../api/stepExpApi";
import CommonDialog from "../../components/common/CommonDialog";
import "./css/systemConfigManagement.css";

export function SystemConfigManagement() {
  return <SettingsPage />;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("steps");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [baseExp, setBaseExp] = useState(0);
  const [apiDescription, setApiDescription] = useState("");

  // State quản lý hiển thị Popup Dialog
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Hàm đóng Dialog
  const closeDialog = () => {
    setDialogConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchStepConfig = useCallback(async () => {
    try {
      const res = await getStepExpRate();
      if (res && res.success && res.data) {
        setBaseExp(res.data.baseExp);
        setApiDescription(res.data.description);
      }
    } catch (error) {
      console.error("Fetch Step Config Error:", error);
    }
  }, []);

  useEffect(() => {
    const loadAllConfig = async () => {
      setIsInitialLoading(true);
      await fetchStepConfig();
      setIsInitialLoading(false);
    };
    loadAllConfig();
  }, [fetchStepConfig]);

  const handleSaveSteps = async () => {
    setIsSaving(true);
    try {
      const res = await updateStepExpRate(baseExp);

      if (res && res.success) {
        setDialogConfig({
          isOpen: true,
          type: "success",
          title: "Thành công",
          message: "Cập nhật Sinh Mệnh Lực nhận được thành công!",
        });
        await fetchStepConfig();
      } else {
        setDialogConfig({
          isOpen: true,
          type: "error",
          title: "Thất bại",
          message: res.message || "Cập nhật cấu hình thất bại.",
        });
      }
    } catch (error) {
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Lỗi hệ thống",
        message: "Đã có lỗi xảy ra khi kết nối server.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center gap-2 sys-config-wrapper">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Đang tải cấu hình hệ thống...</span>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6 sys-config-wrapper">
      <div>
        <h1 className="text-2xl font-bold mb-1">Cài đặt hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình thông số toàn bộ hệ thống
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 hover:[&_button]:cursor-pointer">
        {/* Sidebar Tabs */}
        <div className="bg-card border border-border rounded-xl p-4 self-start lg:sticky lg:top-6">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("steps")}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === "steps"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Footprints className="w-4 h-4" />
              Cấu hình bước chân
            </button>
            <button
              onClick={() => setActiveTab("spirit")}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === "spirit"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Sprout className="w-4 h-4" />
              Cấu hình Tinh Linh
            </button>
          </nav>
        </div>

        {/* Nội dung Tabs */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 shadow-sm">
          {/* TAB 1: CẤU HÌNH BƯỚC CHÂN */}
          {activeTab === "steps" && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Cấu hình bước chân
                </h2>
              </div>

              {/* Chỉ có 1 trường nhập liệu duy nhất theo yêu cầu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/90">
                    Sinh Mệnh Lực nhận được (Base EXP)
                  </label>
                  <input
                    type="number"
                    value={baseExp}
                    onChange={(e) => setBaseExp(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    placeholder="VD: 100"
                  />
                  <p className="text-xs text-muted-foreground pt-1">
                    Lượng Sinh Mệnh Lực tinh linh sẽ nhận được
                  </p>
                </div>
              </div>

              {/* Box thông báo quy đổi từ API */}
              <div className="p-4 bg-info/10 border border-info/20 rounded-xl flex gap-3 items-start">
                <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0 text-info" />
                <div className="text-sm text-foreground/90 space-y-2">
                  <strong className="text-info font-semibold">
                    Yêu cầu & Quy đổi:
                  </strong>
                  <blockquote className="border-l-2 border-info/30 pl-3 italic text-muted-foreground py-1">
                    "{apiDescription || "Đang tải thông báo từ hệ thống..."}"
                  </blockquote>
                  <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded border border-border">
                    Ứng dụng sẽ tự động gọi API mỗi khi người dùng đạt mốc.
                    Lượng Sinh Mệnh Lực nhận được (EXP) sẽ tương đương với tỷ lệ
                    Base EXP bạn thiết lập phía trên.
                  </p>
                </div>
              </div>

              <div className="flex justify-start gap-3 pt-5 border-t border-border mt-8">
                <button
                  onClick={handleSaveSteps}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Đang xử lý..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CẤU HÌNH TINH LINH */}
          {activeTab === "spirit" && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Cấu hình Tinh Linh
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Đang chờ cập nhật API cấu hình Tinh Linh...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render Component Dialog ở cuối trang */}
      <CommonDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onClose={closeDialog}
      />
    </div>
  );
}
