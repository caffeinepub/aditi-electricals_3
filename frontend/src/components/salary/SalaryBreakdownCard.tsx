import React from 'react';
import { SalaryRecord } from '../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMonthName } from '../../utils/dateUtils';
import { IndianRupee } from 'lucide-react';

interface SalaryBreakdownCardProps {
  record: SalaryRecord;
  workerName?: string;
}

function calcSalary(record: SalaryRecord) {
  const monthlySalary = Number(record.monthlySalary);
  const cutDays = Number(record.cutDays);
  const companyHolidays = Number(record.companyHolidays);
  const advanceAmount = Number(record.advanceAmount);
  const carryForward = Number(record.carryForward);

  const perDayRate = Math.floor(monthlySalary / 30);
  const finalDeductibleDays = Math.max(0, cutDays - companyHolidays);
  const cutAmount = finalDeductibleDays * perDayRate;
  const netPay = monthlySalary - cutAmount - advanceAmount + carryForward;

  return { perDayRate, finalDeductibleDays, cutAmount, netPay };
}

export default function SalaryBreakdownCard({ record, workerName }: SalaryBreakdownCardProps) {
  const { perDayRate, finalDeductibleDays, cutAmount, netPay } = calcSalary(record);
  const month = Number(record.month);
  const year = Number(record.year);

  const rows = [
    { label: 'Monthly Salary', value: `₹${Number(record.monthlySalary).toLocaleString('en-IN')}`, highlight: false },
    { label: 'Per Day Salary', value: `₹${perDayRate.toLocaleString('en-IN')}`, highlight: false },
    { label: 'Present Days', value: String(Number(record.presentDays)), highlight: false },
    { label: 'Absent Days', value: String(Number(record.absentDays)), highlight: false },
    { label: 'Cut Days', value: String(Number(record.cutDays)), highlight: false },
    { label: 'Company Holidays', value: String(Number(record.companyHolidays)), highlight: false },
    { label: 'Final Deductible Days', value: String(finalDeductibleDays), highlight: true },
    { label: 'Cut Amount', value: `₹${cutAmount.toLocaleString('en-IN')}`, highlight: true },
    { label: 'Advance', value: `₹${Number(record.advanceAmount).toLocaleString('en-IN')}`, highlight: false },
    { label: 'Carry Forward', value: `₹${Number(record.carryForward).toLocaleString('en-IN')}`, highlight: false },
  ];

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-sky-500 to-blue-600 text-white pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-lg">
              {getMonthName(month)} {year}
            </CardTitle>
            {workerName && <p className="text-sky-100 text-sm mt-0.5">{workerName}</p>}
          </div>
          <div className="text-right">
            <div className="text-sky-200 text-xs">Net Pay</div>
            <div className="text-2xl font-bold text-white flex items-center gap-1">
              <IndianRupee className="w-5 h-5" />
              {netPay.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <div
              key={i}
              className={`flex justify-between items-center px-4 py-3 ${row.highlight ? 'bg-orange-50' : ''}`}
            >
              <span className={`text-sm ${row.highlight ? 'font-semibold text-orange-700' : 'text-gray-600'}`}>
                {row.label}
              </span>
              <span className={`text-sm font-semibold ${row.highlight ? 'text-orange-700' : 'text-gray-800'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-blue-600 px-4 py-3 flex justify-between items-center">
          <span className="text-white font-bold">Final Net Pay</span>
          <span className="text-white font-bold text-lg">₹{netPay.toLocaleString('en-IN')}</span>
        </div>
        {record.manualOverride && (
          <div className="bg-amber-50 px-4 py-2 text-xs text-amber-700 text-center">
            ⚠️ Manual override applied
          </div>
        )}
      </CardContent>
    </Card>
  );
}
