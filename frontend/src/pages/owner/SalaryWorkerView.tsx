import React, { useState } from 'react';
import { useGetSalaryRecord } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, IndianRupee, Loader2 } from 'lucide-react';
import { getCurrentMonthYear, getMonthName } from '../../utils/dateUtils';

interface Props {
  workerId: string;
  workerName?: string;
}

export default function SalaryWorkerView({ workerId, workerName }: Props) {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  const { data: record, isLoading } = useGetSalaryRecord(workerId, month, year);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const calc = record ? (() => {
    const ms = Number(record.monthlySalary);
    const perDay = Math.round(ms / 30);
    const cd = Number(record.cutDays);
    const ch = Number(record.companyHolidays);
    const finalDed = Math.max(0, cd - ch);
    const cutAmt = finalDed * perDay;
    const adv = Number(record.advanceAmount);
    const cf = Number(record.carryForward);
    const net = ms - cutAmt - adv + cf;
    return { ms, perDay, finalDed, cutAmt, adv, cf, net };
  })() : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-sm font-semibold w-32 text-center">{getMonthName(month)} {year}</span>
        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : record && calc ? (
        <Card className="card-shadow border-0 overflow-hidden">
          <CardHeader className="bg-[var(--header-bg)] text-white pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-base">{getMonthName(month)} {year}</CardTitle>
                {workerName && <p className="text-white/70 text-sm mt-0.5">{workerName}</p>}
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Net Pay</p>
                <div className="flex items-center gap-1 text-xl font-bold text-white">
                  <IndianRupee className="w-4 h-4" />{calc.net.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {[
              { label: 'Monthly Salary', value: `₹${calc.ms.toLocaleString('en-IN')}` },
              { label: 'Per Day', value: `₹${calc.perDay.toLocaleString('en-IN')}` },
              { label: 'Present Days', value: String(Number(record.presentDays)) },
              { label: 'Absent Days', value: String(Number(record.absentDays)) },
              { label: 'Cut Days', value: String(Number(record.cutDays)) },
              { label: 'Company Holidays', value: String(Number(record.companyHolidays)) },
              { label: 'Final Deductible', value: String(calc.finalDed), highlight: true },
              { label: 'Cut Amount', value: `-₹${calc.cutAmt.toLocaleString('en-IN')}`, highlight: true },
              { label: 'Advance', value: `₹${calc.adv.toLocaleString('en-IN')}` },
              { label: 'Carry Forward', value: `₹${calc.cf.toLocaleString('en-IN')}` },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between px-4 py-2.5 text-sm ${row.highlight ? 'bg-orange-50' : ''}`}>
                <span className={row.highlight ? 'font-semibold text-orange-700' : 'text-muted-foreground'}>{row.label}</span>
                <span className={`font-semibold ${row.highlight ? 'text-orange-700' : 'text-foreground'}`}>{row.value}</span>
              </div>
            ))}
            <div className="bg-[var(--header-bg)] px-4 py-3 flex justify-between items-center">
              <span className="text-white font-bold">Net Pay</span>
              <span className="text-white font-bold">₹{calc.net.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-shadow border-0">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No salary record for {getMonthName(month)} {year}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
