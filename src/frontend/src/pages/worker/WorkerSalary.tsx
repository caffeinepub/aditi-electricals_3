import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, IndianRupee, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useGetSalaryRecord } from "../../hooks/useQueries";
import { getCurrentMonthYear, getMonthName } from "../../utils/dateUtils";

function SalaryRow({
  label,
  value,
  highlight = false,
}: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`flex justify-between items-center py-3 px-4 border-b border-border last:border-0 ${highlight ? "bg-orange-50" : ""}`}
    >
      <span
        className={`text-sm ${highlight ? "font-semibold text-orange-700" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${highlight ? "text-orange-700" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function WorkerSalary() {
  const { user } = useAuth();
  const workerId = user?.workerId || "";
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  const { data: record, isLoading } = useGetSalaryRecord(workerId, month, year);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const calcSalary = () => {
    if (!record) return null;
    const ms = Number(record.monthlySalary);
    const perDay = ms / 30;
    const presentDays = Number(record.presentDays);
    const absentDays = Number(record.absentDays);
    const ch = Number(record.companyHolidays);
    // Final deductible days = absent - 2 free leave (minimum 0), same logic as owner view
    const finalDed = Math.max(0, absentDays - 2);
    const cutAmt = finalDed * perDay;
    const adv = Number(record.advanceAmount);
    const cf = Number(record.carryForward);
    // Use backend's stored netPay if available, otherwise recalculate
    const storedNet = Number(record.netPay);
    const net = storedNet > 0 ? storedNet : Math.max(0, ms - cutAmt - adv + cf);
    return {
      ms,
      perDay,
      presentDays,
      absentDays,
      cd: finalDed,
      ch,
      finalDed,
      cutAmt,
      adv,
      cf,
      net,
    };
  };

  const calc = calcSalary();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Salary</h2>

      {/* Month Navigator */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-base font-semibold w-36 text-center">
          {getMonthName(month)} {year}
        </span>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : record && calc ? (
        <Card className="card-shadow border-0 overflow-hidden">
          <CardHeader className="bg-[var(--header-bg)] text-white pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">
                  {getMonthName(month)} {year}
                </CardTitle>
                <p className="text-white/70 text-sm mt-0.5">{user?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Payable Salary</p>
                <div className="flex items-center gap-1 text-2xl font-bold text-white">
                  <IndianRupee className="w-5 h-5" />
                  {calc.net.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <SalaryRow
              label="Monthly Salary"
              value={`₹${calc.ms.toLocaleString("en-IN")}`}
            />
            <SalaryRow
              label="Per Day Salary (÷30)"
              value={`₹${calc.perDay.toFixed(2)}`}
            />
            <SalaryRow label="Present Days" value={String(calc.presentDays)} />
            <SalaryRow label="Absent Days" value={String(calc.absentDays)} />
            <SalaryRow
              label="Cut Days (Absent − 2 free leave)"
              value={String(calc.cd)}
            />
            <SalaryRow
              label="Company Holidays (this month)"
              value={String(calc.ch)}
            />
            <SalaryRow
              label="Final Deductible Days"
              value={String(calc.finalDed)}
              highlight
            />
            <SalaryRow
              label="Cut Amount"
              value={`₹${Math.abs(calc.cutAmt).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
              highlight
            />
            <SalaryRow
              label="Advance"
              value={`₹${Math.abs(calc.adv).toLocaleString("en-IN")}`}
            />
            <SalaryRow
              label="Carry Forward"
              value={`₹${calc.cf.toLocaleString("en-IN")}`}
            />
            {/* Final Net Pay – prominently displayed */}
            <div
              style={{
                background: "var(--header-bg, #1d6fb8)",
                padding: "18px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "3px solid rgba(255,255,255,0.2)",
              }}
            >
              <div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 12,
                    marginBottom: 2,
                  }}
                >
                  Payable Salary
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                  Final Net Pay
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                  = Monthly − Cut − Advance + CF
                </div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 24 }}>
                  ₹{calc.net.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-shadow border-0">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              No salary record for {getMonthName(month)} {year}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Contact the owner for salary details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
