import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetSalaryRecord } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, IndianRupee, Loader2 } from 'lucide-react';
import { getCurrentMonthYear, getMonthName } from '../../utils/dateUtils';

function SalaryRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-3 px-4 border-b border-border last:border-0 ${highlight ? 'bg-orange-50' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-semibold text-orange-700' : 'text-muted-foreground'}`}>{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-orange-700' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export default function WorkerSalary() {
  const { user } = useAuth();
  const workerId = user?.workerId || '';
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

  const calcSalary = () => {
    if (!record) return null;
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
  };

  const calc = calcSalary();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Salary</h2>

      {/* Month Navigator */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-base font-semibold w-36 text-center">{getMonthName(month)} {year}</span>
        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : record && calc ? (
        <Card className="card-shadow border-0 overflow-hidden">
          <CardHeader className="bg-[var(--header-bg)] text-white pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">{getMonthName(month)} {year}</CardTitle>
                <p className="text-white/70 text-sm mt-0.5">{user?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Net Pay</p>
                <div className="flex items-center gap-1 text-2xl font-bold text-white">
                  <IndianRupee className="w-5 h-5" />
                  {calc.net.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <SalaryRow label="Monthly Salary" value={`₹${calc.ms.toLocaleString('en-IN')}`} />
            <SalaryRow label="Per Day Salary" value={`₹${calc.perDay.toLocaleString('en-IN')}`} />
            <SalaryRow label="Present Days" value={String(Number(record.presentDays))} />
            <SalaryRow label="Absent Days" value={String(Number(record.absentDays))} />
            <SalaryRow label="Cut Days" value={String(Number(record.cutDays))} />
            <SalaryRow label="Company Holidays" value={String(Number(record.companyHolidays))} />
            <SalaryRow label="Final Deductible Days" value={String(calc.finalDed)} highlight />
            <SalaryRow label="Cut Amount" value={`-₹${calc.cutAmt.toLocaleString('en-IN')}`} highlight />
            <SalaryRow label="Advance" value={`₹${calc.adv.toLocaleString('en-IN')}`} />
            <SalaryRow label="Carry Forward" value={`₹${calc.cf.toLocaleString('en-IN')}`} />
            <div className="bg-[var(--header-bg)] px-4 py-3 flex justify-between items-center">
              <span className="text-white font-bold">Final Net Pay</span>
              <span className="text-white font-bold text-lg">₹{calc.net.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-shadow border-0">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No salary record for {getMonthName(month)} {year}</p>
            <p className="text-muted-foreground text-sm mt-1">Contact the owner for salary details.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
