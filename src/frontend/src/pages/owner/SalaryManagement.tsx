import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  useAddSalaryRecord,
  useGetAllHolidays,
  useGetAllWorkers,
  useGetSalaryRecord,
  useUpdateSalaryRecord,
} from "../../hooks/useQueries";
import { getMonthName } from "../../utils/dateUtils";

interface SalaryManagementProps {
  initialWorkerId?: string;
}

// Helper: parse string to number safely (empty string -> 0)
function parseNum(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

export default function SalaryManagement({
  initialWorkerId,
}: SalaryManagementProps) {
  const today = new Date();
  const [selectedWorkerId, setSelectedWorkerId] = useState(
    initialWorkerId || "",
  );
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Use string state so user can freely clear & type (no forced "0" blocking)
  const [presentDaysStr, setPresentDaysStr] = useState("");
  const [absentDaysStr, setAbsentDaysStr] = useState("");
  const [advanceAmountStr, setAdvanceAmountStr] = useState("");
  const [carryForwardStr, setCarryForwardStr] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [overrideNetPayStr, setOverrideNetPayStr] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: workers = [], isLoading: workersLoading } = useGetAllWorkers();
  const { data: holidays = [] } = useGetAllHolidays();
  const { data: salaryRecord, isLoading: salaryLoading } = useGetSalaryRecord(
    selectedWorkerId,
    selectedMonth,
    selectedYear,
  );

  const addSalaryMutation = useAddSalaryRecord();
  const updateSalaryMutation = useUpdateSalaryRecord();

  const selectedWorker = workers.find((w) => w.workerId === selectedWorkerId);

  const companyHolidaysCount = holidays.filter((h) => {
    const [y, m] = h.date.split("-").map(Number);
    return y === selectedYear && m === selectedMonth;
  }).length;

  useEffect(() => {
    if (salaryRecord) {
      setPresentDaysStr(String(Number(salaryRecord.presentDays)));
      setAbsentDaysStr(String(Number(salaryRecord.absentDays)));
      setAdvanceAmountStr(String(Number(salaryRecord.advanceAmount)));
      setCarryForwardStr(String(Number(salaryRecord.carryForward)));
      setManualOverride(salaryRecord.manualOverride);
      setOverrideNetPayStr(String(Number(salaryRecord.netPay)));
    } else {
      setPresentDaysStr("");
      setAbsentDaysStr("");
      setAdvanceAmountStr("");
      setCarryForwardStr("");
      setManualOverride(false);
      setOverrideNetPayStr("");
    }
    setSaveError("");
    setSaveSuccess(false);
  }, [salaryRecord]);

  // Derive numeric values for calculations
  const presentDays = parseNum(presentDaysStr);
  const absentDays = parseNum(absentDaysStr);
  const advanceAmount = parseNum(advanceAmountStr);
  const carryForward = parseNum(carryForwardStr);
  const overrideNetPay = parseNum(overrideNetPayStr);

  const monthlySalary = selectedWorker
    ? Number(selectedWorker.monthlySalary)
    : 0;
  const perDaySalary = monthlySalary / 30;
  const freeLeave = 2;
  const deductibleDays = Math.max(0, absentDays - freeLeave);
  const cutAmount = deductibleDays * perDaySalary;
  const calculatedNetPay = Math.max(
    0,
    monthlySalary - cutAmount - advanceAmount + carryForward,
  );
  const finalNetPay = manualOverride
    ? Math.max(0, overrideNetPay)
    : calculatedNetPay;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else setSelectedMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else setSelectedMonth((m) => m + 1);
  };

  const handleSave = async () => {
    if (!selectedWorkerId || !selectedWorker) return;
    setSaveError("");
    setSaveSuccess(false);

    const params = {
      workerId: selectedWorkerId,
      month: selectedMonth,
      year: selectedYear,
      monthlySalary,
      presentDays,
      absentDays,
      cutDays: deductibleDays,
      advanceAmount,
      carryForward,
      companyHolidays: companyHolidaysCount,
    };

    try {
      if (salaryRecord) {
        await updateSalaryMutation.mutateAsync({
          salaryId: salaryRecord.salaryId,
          ...params,
          manualOverride,
          overrideNetPay: manualOverride ? overrideNetPay : null,
        });
      } else {
        await addSalaryMutation.mutateAsync(params);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError((err as Error)?.message || "Failed to save salary record.");
    }
  };

  const isSaving =
    addSalaryMutation.isPending || updateSalaryMutation.isPending;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #CFCFCF",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#1F2937",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1F2937",
          marginBottom: 20,
        }}
      >
        Salary Management
      </h1>

      {/* Worker & Month Selection */}
      <div style={cardStyle}>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 16,
          }}
        >
          Select Worker & Period
        </h2>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div>
            <label
              htmlFor="salary-worker-select"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Worker
            </label>
            {workersLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#6B7280",
                  fontSize: 13,
                }}
              >
                <Loader2
                  size={14}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />{" "}
                Loading...
              </div>
            ) : (
              <select
                id="salary-worker-select"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select a worker</option>
                {workers.map((w) => (
                  <option key={w.workerId} value={w.workerId}>
                    {w.workerId} — {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <p
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Month & Year
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  background: "#F3F4F6",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  flex: 1,
                  textAlign: "center",
                }}
              >
                {getMonthName(selectedMonth)} {selectedYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  background: "#F3F4F6",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedWorkerId &&
        selectedWorker &&
        (salaryLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
            <Loader2
              size={24}
              style={{
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 8px",
              }}
            />
            <p style={{ fontSize: 14 }}>Loading salary data...</p>
          </div>
        ) : (
          <>
            {/* Salary Inputs */}
            <div style={cardStyle}>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1F2937",
                  marginBottom: 16,
                }}
              >
                Attendance & Adjustments
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label
                    htmlFor="salary-present-days"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Present Days
                  </label>
                  <input
                    id="salary-present-days"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={presentDaysStr}
                    placeholder="0"
                    onChange={(e) => {
                      // Allow only digits
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setPresentDaysStr(v);
                    }}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3B82F6";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#CFCFCF";
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="salary-absent-days"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Absent Days
                  </label>
                  <input
                    id="salary-absent-days"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={absentDaysStr}
                    placeholder="0"
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setAbsentDaysStr(v);
                    }}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3B82F6";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#CFCFCF";
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="salary-advance"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Advance (₹)
                  </label>
                  <input
                    id="salary-advance"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={advanceAmountStr}
                    placeholder="0"
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setAdvanceAmountStr(v);
                    }}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3B82F6";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#CFCFCF";
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="salary-carry-forward"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Carry Forward (₹)
                  </label>
                  <input
                    id="salary-carry-forward"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={carryForwardStr}
                    placeholder="0"
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setCarryForwardStr(v);
                    }}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3B82F6";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#CFCFCF";
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  id="manualOverride"
                  checked={manualOverride}
                  onChange={(e) => setManualOverride(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <label
                  htmlFor="manualOverride"
                  style={{
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  Manual Override Net Pay
                </label>
              </div>
              {manualOverride && (
                <div style={{ marginTop: 12 }}>
                  <label
                    htmlFor="salary-override-net"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Override Net Pay (₹)
                  </label>
                  <input
                    id="salary-override-net"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={overrideNetPayStr}
                    placeholder="0"
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setOverrideNetPayStr(v);
                    }}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3B82F6";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#CFCFCF";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Salary Breakdown */}
            <div style={cardStyle}>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1F2937",
                  marginBottom: 16,
                }}
              >
                Salary Breakdown
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  {
                    label: "Monthly Salary",
                    value: `₹${monthlySalary.toLocaleString("en-IN")}`,
                  },
                  {
                    label: "Per Day Salary (÷30)",
                    value: `₹${perDaySalary.toFixed(2)}`,
                  },
                  { label: "Absent Days", value: String(absentDays) },
                  { label: "Free Leave Days", value: "2" },
                  {
                    label: "Deductible Days (Absent - 2)",
                    value: String(deductibleDays),
                  },
                  {
                    label: "Deduction Amount",
                    value: `₹${Math.abs(cutAmount).toFixed(2)}`,
                  },
                  {
                    label: "Advance",
                    value: `₹${Math.abs(advanceAmount).toLocaleString("en-IN")}`,
                  },
                  {
                    label: "Carry Forward",
                    value: `₹${carryForward.toLocaleString("en-IN")}`,
                  },
                  {
                    label: "Company Holidays (this month)",
                    value: String(companyHolidaysCount),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid #F3F4F6",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>{row.label}</span>
                    <span style={{ fontWeight: 500, color: "#1F2937" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "#3B82F6",
                    borderRadius: 8,
                    marginTop: 12,
                  }}
                >
                  <span
                    style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}
                  >
                    Net Pay
                  </span>
                  <span
                    style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}
                  >
                    ₹{finalNetPay.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {saveError && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  color: "#991B1B",
                  fontSize: 13,
                }}
              >
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  color: "#166534",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                ✓ Salary record saved successfully!
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                width: "100%",
                padding: "13px",
                background: isSaving ? "#93C5FD" : "#3B82F6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isSaving && (
                <Loader2
                  size={16}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
              )}
              {isSaving
                ? "Saving..."
                : salaryRecord
                  ? "Update Salary Record"
                  : "Save Salary Record"}
            </button>
          </>
        ))}

      {!selectedWorkerId && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ color: "#9CA3AF", fontSize: 15 }}>
            Select a worker to manage their salary.
          </p>
        </div>
      )}

      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
