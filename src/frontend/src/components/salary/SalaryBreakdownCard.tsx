import React from "react";
import type { SalaryRecord } from "../../backend";

interface SalaryBreakdownCardProps {
  record: SalaryRecord;
  workerName?: string;
}

export default function SalaryBreakdownCard({
  record,
  workerName,
}: SalaryBreakdownCardProps) {
  const monthlySalary = Number(record.monthlySalary);
  const absentDays = Number(record.absentDays);
  const companyHolidays = Number(record.companyHolidays);
  const advanceAmount = Number(record.advanceAmount);
  const carryForward = Number(record.carryForward);

  // Fixed 30-day divisor
  const perDaySalary = monthlySalary / 30;

  // Deductible days = max(0, absentDays - companyHolidays)
  const deductibleDays = Math.max(0, absentDays - companyHolidays);

  // Cut amount
  const cutAmount = deductibleDays * perDaySalary;

  // Net pay
  const netPay = monthlySalary - cutAmount - advanceAmount + carryForward;

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = monthNames[Number(record.month) - 1] || "";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">
              {workerName || `Worker ${record.workerId}`}
            </h3>
            <p className="text-blue-100 text-sm mt-0.5">
              {monthName} {Number(record.year)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-xs">Net Pay</p>
            <p className="text-white font-bold text-2xl">
              {formatCurrency(netPay)}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Monthly Salary</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(monthlySalary)}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Per Day Rate (÷30)</span>
          <span className="text-sm font-medium text-gray-700">
            {formatCurrency(perDaySalary)}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Present Days</span>
          <span className="text-sm font-medium text-green-700">
            {Number(record.presentDays)} days
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Absent Days</span>
          <span className="text-sm font-medium text-red-600">
            {absentDays} days
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Company Holidays</span>
          <span className="text-sm font-medium text-blue-600">
            {companyHolidays} days
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <span className="text-sm text-gray-600">Deductible Days</span>
            <p className="text-xs text-gray-400">
              Absent − Holidays = {absentDays} − {companyHolidays}
            </p>
          </div>
          <span className="text-sm font-medium text-orange-600">
            {deductibleDays} days
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Salary Deduction</span>
          <span className="text-sm font-medium text-red-600">
            − {formatCurrency(cutAmount)}
          </span>
        </div>

        {advanceAmount > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Advance Deduction</span>
            <span className="text-sm font-medium text-red-600">
              − {formatCurrency(advanceAmount)}
            </span>
          </div>
        )}

        {carryForward !== 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Carry Forward</span>
            <span
              className={`text-sm font-medium ${carryForward >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {carryForward >= 0 ? "+" : ""}
              {formatCurrency(carryForward)}
            </span>
          </div>
        )}

        {/* Net Pay */}
        <div className="flex justify-between items-center pt-3 mt-1">
          <span className="text-base font-bold text-gray-900">Net Pay</span>
          <span
            className={`text-xl font-bold ${netPay >= 0 ? "text-green-700" : "text-red-600"}`}
          >
            {formatCurrency(netPay)}
          </span>
        </div>
      </div>

      {record.manualOverride && (
        <div className="px-5 pb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
            Manual Override Applied
          </span>
        </div>
      )}
    </div>
  );
}
