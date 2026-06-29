import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import CustomSelect from "../../../components/common/CustomSelect.jsx";
import { Table, TableEmpty } from "../../../components/common/table.jsx";
import { Pagination } from "../../../components/common/pagination.jsx";
import { Button } from "../../../components/common/button.jsx";
import { achievementApi } from "../../../api/achievementApi";
import { itemApi } from "../../../api/itemApi";
import { missionApi } from "../../../api/missionApi";
import "../../missions/css/missionsManagement.css";

const ITEMS_PER_PAGE = 5;

export function AchievementsManagementPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [items, setItems] = useState([]);
  const [metricCodes, setMetricCodes] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    title: "",
    description: "",
    iconUrl: "",
    iconFile: null,
    isActive: true,
    status: "active",
    walletAmount: 0,
    rewardWalletAmount: 0,
    metricCode: "",
    targetValue: "",
    completionConditionCode: "",
    completionTargetValue: "",
    assignmentConditionCode: "",
    assignmentTargetValue: "",
    rewardItemList: [],
  });

  const loadAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await achievementApi.getAll();
      const data = resp?.data || resp || {};
      setSummary(data.summary || {});
      setAchievements(Array.isArray(data.achievements) ? data.achievements : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Lỗi khi tải danh sách thành tựu");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const resp = await itemApi.getAll();
      const data = resp?.data || resp || {};
      if (Array.isArray(data)) {
        setItems(data);
      } else if (Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách vật phẩm:", err);
      setItems([]);
    }
  };

  const loadMetricCodes = async () => {
    try {
      const resp = await missionApi.getMetricCodes();
      const data = resp?.data || resp || [];
      const codes = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setMetricCodes(codes);
      if (codes.length > 0) {
        const defaultMetricCode = codes[0]?.code || codes[0]?.id || "";
        setForm((prev) => ({
          ...prev,
          metricCode: prev.metricCode || defaultMetricCode,
          completionConditionCode: prev.completionConditionCode || defaultMetricCode,
        }));
      }
    } catch (err) {
      console.error("Lỗi tải metric codes:", err);
      setMetricCodes([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadAchievements();
      await loadItems();
      await loadMetricCodes();
    };
    init();
  }, []);

  const metricCodeOptions = useMemo(() => {
    return metricCodes.map((metric) => ({
      id: metric.code,
      label: metric.label || metric.valueLabel || metric.code,
    }));
  }, [metricCodes]);

  const typeOptions = useMemo(() => {
    return [
      { id: "", label: "Tất cả loại" },
      ...metricCodeOptions,
    ];
  }, [metricCodeOptions]);

  const statusOptions = [
    { id: "", label: "Tất cả trạng thái" },
    { id: "active", label: "Hoạt động" },
    { id: "inactive", label: "Vô hiệu" },
  ];

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      // type/metricCode filter
      if (typeFilter) {
        const code = (a?.metricCode || a?.type || a?.achievementType || "").toString();
        if (code.toLowerCase() !== typeFilter.toString().toLowerCase()) return false;
      }

      // status filter
      if (statusFilter) {
        const active = !!a?.isActive;
        if (statusFilter === "active" && !active) return false;
        if (statusFilter === "inactive" && active) return false;
      }

      return true;
    });
  }, [achievements, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const conditionOptions = useMemo(() => {
    return metricCodeOptions.map((opt) => ({
      id: opt.id,
      label: opt.label,
    }));
  }, [metricCodeOptions]);

  const unlockConditionOptions = [
    { id: "", label: "MẶC ĐỊNH MỞ KHÓA" },
    ...conditionOptions.map((opt) => ({ id: opt.id, label: opt.label })),
  ];

  const itemOptions = useMemo(() => {
    return items.map((item) => ({
      id: item.itemId || item.id || "",
      label: item.itemName || item.name || "",
    }));
  }, [items]);

  const resetForm = () =>
    setForm({
      title: "",
      description: "",
      iconUrl: "",
      iconFile: null,
      isActive: true,
      status: "active",
      walletAmount: 0,
      rewardWalletAmount: 0,
      metricCode: "",
      targetValue: "",
      completionConditionCode: "",
      completionTargetValue: "",
      assignmentConditionCode: "",
      assignmentTargetValue: "",
      rewardItemList: [],
    });

  const setFormField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getAchievementTitle = (a) => {
    return a?.title || a?.achievementName || a?.name || a?.missionName || "-";
  };

  const isAchievementActive = (a) => {
    if (typeof a?.isActive === "boolean") return a.isActive;
    if (typeof a?.status === "string") return a.status.toLowerCase() === "active";
    return false;
  };

  const formatCondition = (a) => {
    const directTargetCandidates = [
      a?.completionTargetValue,
      a?.completionTarget,
      a?.targetValue,
      a?.goalValue,
      a?.conditionTargetValue,
    ];
    const directTarget = directTargetCandidates.find((v) => v !== null && v !== undefined && v !== "");
    if (directTarget !== undefined) {
      return Number(directTarget || 0).toLocaleString("vi-VN");
    }

    const completionConditions = Array.isArray(a?.completionConditions)
      ? a.completionConditions
      : [];

    if (completionConditions.length > 0) {
      return completionConditions
        .map((c) => Number(c?.targetValue ?? c?.target ?? 0).toLocaleString("vi-VN"))
        .join(" | ");
    }

    return "-";
  };

  const formatReward = (a) => {
    const parts = [];

    const wallet = Number(
      a?.rewardWalletAmount ??
      a?.walletAmount ??
      a?.rewardAmount ??
      a?.reward?.walletAmount ??
      a?.rewards?.walletAmount ??
      0,
    );
    if (wallet > 0) {
      parts.push(`+${wallet.toLocaleString("vi-VN")} Giọt Sương`);
    }

    const rewardItems = Array.isArray(a?.rewardItems)
      ? a.rewardItems
      : Array.isArray(a?.rewardItemList)
        ? a.rewardItemList
        : Array.isArray(a?.reward?.items)
          ? a.reward.items
          : Array.isArray(a?.rewards?.items)
            ? a.rewards.items
            : [];
    if (rewardItems.length > 0) {
      const itemsText = rewardItems
        .map(
          (item) =>
            `${item?.itemName || item?.name || item?.title || "Vật phẩm"} x${item?.quantity ?? item?.qty ?? 0}`,
        )
        .join(", ");
      parts.push(itemsText);
    }

    return parts.length > 0 ? parts.join(" | ") : "-";
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, iconFile: file, iconUrl: file.name }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (!form.title?.trim()) {
        alert("Tên thành tựu là bắt buộc.");
        return;
      }
      if (!form.metricCode) {
        alert("Loại thành tựu (Metric code) là bắt buộc.");
        return;
      }
      if (Number(form.targetValue) <= 0) {
        alert("Mục tiêu thành tựu phải lớn hơn 0.");
        return;
      }

      const selectedRewards = (form.rewardItemList || [])
        .filter((reward) => reward.itemId && Number(reward.quantity) > 0)
        .map((reward) => ({
          itemId: reward.itemId,
          quantity: Number(reward.quantity) || 0,
        }));

      const infoWallet = Number(form.walletAmount) || 0;
      const rewardWallet = Number(form.rewardWalletAmount) || 0;
      const finalWalletAmount = rewardWallet > 0 ? rewardWallet : infoWallet;

      if (finalWalletAmount <= 0 && selectedRewards.length === 0) {
        alert("Thành tựu phải có ít nhất một phần thưởng.");
        return;
      }

      const completionConditions = [
        {
          conditionCode: form.completionConditionCode,
          targetValue: Number(form.completionTargetValue) || 0,
        },
      ];

      const assignmentConditions = [];
      if (form.assignmentConditionCode) {
        assignmentConditions.push({
          conditionCode: form.assignmentConditionCode,
          targetValue: Number(form.assignmentTargetValue) || 0,
          referenceAchievementId: "",
        });
      }

      const formData = new FormData();
      formData.append("Title", form.title.trim());
      formData.append("Description", form.description || "");
      formData.append("IsActive", String(form.status === "active"));
      formData.append("WalletAmount", String(finalWalletAmount));
      formData.append("MetricCode", String(form.metricCode || ""));
      formData.append("TargetValue", String(Number(form.targetValue) || 0));

      if (form.iconFile) {
        formData.append("Icon", form.iconFile);
      }

      selectedRewards.forEach((reward, index) => {
        formData.append(`RewardItems[${index}].ItemId`, reward.itemId);
        formData.append(`RewardItems[${index}].Quantity`, String(reward.quantity));
      });

      completionConditions.forEach((condition, index) => {
        formData.append(`CompletionConditions[${index}].ConditionCode`, condition.conditionCode || "");
        formData.append(`CompletionConditions[${index}].TargetValue`, String(Number(condition.targetValue) || 0));
      });

      assignmentConditions.forEach((condition, index) => {
        formData.append(`AssignmentConditions[${index}].ConditionCode`, condition.conditionCode || "");
        formData.append(`AssignmentConditions[${index}].TargetValue`, String(Number(condition.targetValue) || 0));
        formData.append(
          `AssignmentConditions[${index}].ReferenceAchievementId`,
          condition.referenceAchievementId || "",
        );
      });

      await achievementApi.create(formData);
      // refresh list
      await loadAchievements();
      resetForm();
      setShowCreate(false);
    } catch (err) {
      console.error(err);
      const backendMessage =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join("\n")
          : null);
      alert(backendMessage || err?.message || "Lỗi khi tạo thành tựu");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">Quản lý thành tựu</h1>
        <p className="text-sm text-muted-foreground">Tạo và quản lý hệ thống thành tựu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Tổng thành tựu</p>
          <p className="text-2xl font-bold">{summary?.totalAchievements ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Đang hoạt động</p>
          <p className="text-2xl font-bold">{summary?.activeAchievements ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Tổng lượt mở khóa</p>
          <p className="text-2xl font-bold">{summary?.totalUnlocks ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành TB</p>
          <p className="text-2xl font-bold text-primary">{summary?.averageCompletionRate ?? 0}%</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="w-56">
              <CustomSelect
                value={typeFilter}
                onChange={(v) => { setTypeFilter(v); setPage(1); }}
                options={typeOptions}
                valueKey="id"
                labelKey="label"
                placeholder="Tất cả loại"
              />
            </div>

            <div className="w-48">
              <CustomSelect
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                options={statusOptions}
                valueKey="id"
                labelKey="label"
                placeholder="Tất cả trạng thái"
              />
            </div>

            {/* search removed per request */}
          </div>

          <div className="ml-4">
            <Button variant="primary" onClick={() => setShowCreate(true)}>+ Tạo thành tựu mới</Button>
          </div>
        </div>

        <Table>
          <thead>
            <tr className="text-left text-sm text-muted-foreground border-b border-border">
              <th className="py-3">Tên nhiệm vụ</th>
              <th className="py-3">Điều kiện</th>
              <th className="py-3">Phần thưởng</th>
              <th className="py-3">Trạng thái</th>
              <th className="py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center">Đang tải dữ liệu...</td>
              </tr>
            )}

            {!loading && pageItems.length === 0 && (
              <TableEmpty colSpan={5} message={error ? error : "Không có thành tựu."} />
            )}

            {!loading && pageItems.map((a) => (
              <tr key={a?.achievementId || a?.id} className="border-b border-border">
                <td className="py-4">
                  <div className="font-medium">{getAchievementTitle(a)}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {a?.achievementId ?? a?.id ?? "-"}
                  </div>
                </td>
                <td className="py-4 text-sm">{formatCondition(a)}</td>
                <td className="py-4 text-sm">{formatReward(a)}</td>
                <td className="py-4 text-sm">
                  <span className={isAchievementActive(a) ? "badge-active" : "badge-inactive"}>
                    {isAchievementActive(a) ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td className="py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Button size="sm">Sửa</Button>
                    <Button size="sm" variant="destructive">Vô hiệu hóa</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="mt-4 flex items-center justify-end">
          <Pagination currentPage={page} totalPages={totalPages} onChange={(p) => setPage(p)} />
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="mission-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="mission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mission-modal-header">
              <div>
                <h2>Tạo thành tựu mới</h2>
                <p>Thiết lập mục tiêu, điều kiện và phần thưởng cho thành tựu.</p>
              </div>
              <button type="button" className="mission-modal-close" onClick={() => setShowCreate(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form className="mission-create-form" onSubmit={handleCreate}>
              <section
                className="mission-form-section"
                style={{ position: "relative", zIndex: 60 }}
              >
                <h3>1. Thông tin thành tựu</h3>
                <div className="mission-form-grid">
                  <label>
                    Tên thành tựu <span className="text-destructive">*</span>
                    <input
                      value={form.title}
                      onChange={(e) => setFormField("title", e.target.value)}
                      required
                      placeholder="Nhập tên thành tựu..."
                    />
                  </label>

                  <div
                    style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 80 }}
                  >
                    <label>
                      Loại thành tựu
                      <CustomSelect
                        value={form.metricCode || ""}
                        onChange={(v) => setFormField("metricCode", v)}
                        options={metricCodeOptions}
                        valueKey="id"
                        labelKey="label"
                        placeholder="Chọn loại"
                      />
                    </label>
                  </div>
                </div>

                <div style={{ position: "relative", zIndex: 10 }}>
                  <label>
                    Mô tả
                    <textarea
                      value={form.description}
                      onChange={(e) => setFormField("description", e.target.value)}
                      rows={3}
                      placeholder="Mô tả chi tiết thành tựu..."
                    />
                  </label>
                </div>

                <div className="mission-form-grid">
                  <label>
                    Mục tiêu thành tựu
                    <input
                      type="number"
                      min="0"
                      value={form.targetValue}
                      onChange={(e) => setFormField("targetValue", e.target.value)}
                      placeholder="Ví dụ: 150"
                    />
                  </label>

                  <label>
                    Giọt Sương thành tựu
                    <input
                      type="number"
                      min="0"
                      value={form.walletAmount}
                      onChange={(e) => setFormField("walletAmount", e.target.value)}
                      placeholder="Ví dụ: 1000"
                    />
                  </label>
                </div>

                <div className="mission-form-grid">
                  <label>
                    Trạng thái hiển thị
                    <CustomSelect
                      value={form.status}
                      onChange={(v) => {
                        setFormField("status", v);
                        setFormField("isActive", v === "active");
                      }}
                      options={statusOptions}
                      valueKey="id"
                      labelKey="label"
                    />
                  </label>
                  <div />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "0.75rem",
                    padding: "0.85rem 1rem",
                  }}
                >
                  <label className="mission-checkbox-row" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => {
                        setFormField("isActive", e.target.checked);
                        setFormField("status", e.target.checked ? "active" : "inactive");
                      }}
                    />
                    <span>Kích hoạt ngay lập tức</span>
                  </label>
                </div>

                <div>
                  <label>
                    Icon (tải lên)
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </section>

              <section className="mission-form-section" style={{ position: "relative", zIndex: 50 }}>
                <h3>2. Điều kiện</h3>
                <div className="mission-form-grid" style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 50 }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "4px" }}>
                      Điều kiện hoàn thành <span className="text-destructive">*</span>
                    </span>
                    <CustomSelect
                      value={form.completionConditionCode}
                      onChange={(val) => setFormField("completionConditionCode", val)}
                      options={conditionOptions.map((opt) => ({ id: opt.id, label: opt.label }))}
                      valueKey="id"
                      labelKey="label"
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "4px" }}>
                      Mục tiêu hoàn thành <span className="text-destructive">*</span>
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={form.completionTargetValue}
                      onChange={(e) => setFormField("completionTargetValue", e.target.value)}
                      placeholder="VD: Nhập số bước chân..."
                      style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", width: "100%" }}
                    />
                  </div>
                </div>

                <div className="mission-form-grid">
                  <div style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 40 }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "4px" }}>
                      Điều kiện mở khóa / Gán (Tùy chọn)
                    </span>
                    <CustomSelect
                      value={form.assignmentConditionCode}
                      onChange={(val) => setFormField("assignmentConditionCode", val)}
                      options={unlockConditionOptions}
                      valueKey="id"
                      labelKey="label"
                      placeholder="Mặc định mở khóa"
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "4px" }}>
                      Mục tiêu mở khóa
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form.assignmentTargetValue}
                      onChange={(e) => setFormField("assignmentTargetValue", e.target.value)}
                      placeholder="VD: Nhập cấp độ để mở khóa..."
                      style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", width: "100%" }}
                    />
                  </div>
                </div>
              </section>

              <section className="mission-form-section">
                <h3>3. Phần thưởng</h3>
                <div style={{ display: "flex", flexDirection: "column", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "4px" }}>
                    Thưởng Giọt Sương
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={form.rewardWalletAmount}
                    onChange={(e) => setFormField("rewardWalletAmount", e.target.value)}
                    placeholder="Nhập số Giọt Sương thưởng (Tùy chọn)..."
                    style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", width: "100%" }}
                  />
                </div>

                <div style={{ background: "#ffffff", borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Vật phẩm thưởng thêm</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormField("rewardItemList", [
                          ...(form.rewardItemList || []),
                          { itemId: "", quantity: "" },
                        ])
                      }
                      className="mission-table-pill-btn"
                      style={{ background: "var(--primary)", color: "#fff", border: "none" }}
                    >
                      <Plus size={14} /> Thêm vật phẩm
                    </button>
                  </div>

                  {(form.rewardItemList || []).map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 items-start"
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "1rem",
                        position: "relative",
                        zIndex: 30 - index,
                      }}
                    >
                      <div style={{ flex: 2, position: "relative", zIndex: 30 - index }}>
                        <CustomSelect
                          value={item.itemId}
                          onChange={(val) => {
                            const newList = [...form.rewardItemList];
                            newList[index].itemId = val;
                            setFormField("rewardItemList", newList);
                          }}
                          options={itemOptions}
                          valueKey="id"
                          labelKey="label"
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newList = [...form.rewardItemList];
                            newList[index].quantity = e.target.value;
                            setFormField("rewardItemList", newList);
                          }}
                          placeholder="Số lượng"
                          style={{
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            border: "1px solid var(--border)",
                            width: "100%",
                            height: "42px",
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newList = [...form.rewardItemList];
                          newList.splice(index, 1);
                          setFormField("rewardItemList", newList);
                        }}
                        style={{
                          padding: "0.5rem",
                          color: "var(--destructive)",
                          background: "rgba(220, 107, 107, 0.1)",
                          borderRadius: "0.5rem",
                          border: "none",
                          cursor: "pointer",
                          height: "42px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {(form.rewardItemList || []).length === 0 && (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted-foreground)",
                        textAlign: "center",
                        margin: 0,
                      }}
                    >
                      Chưa thêm vật phẩm nào.
                    </p>
                  )}
                </div>
              </section>

              <div className="mission-modal-actions">
                <button
                  type="button"
                  className="mission-btn-secondary"
                  onClick={() => {
                    resetForm();
                    setShowCreate(false);
                  }}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="mission-btn-primary" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo thành tựu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AchievementsManagementPage;
