import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetSalaryRecord } from '../../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentMonthYear, getMonthName } from '../../utils/dateUtils';
import SalaryBreakdownCard from '../../components/salary/SalaryBreakdownCard';

export default function WorkerSalary() {
  const { user } = useAuth();
  const workerId = user?.workerId || '';
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  const { data: salaryRecord, isLoading } = useGetSalaryRecord(workerId, month, year);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Salary</h1>
        <p className="text-gray-500 text-sm mt-0.5">View your salary breakdown</p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-base font-semibold text-gray-700 w-36 text-center">{getMonthName(month)} {year}</span>
        <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8 text-center text-gray-400">Loading...</CardContent>
        </Card>
      ) : salaryRecord ? (
        <SalaryBreakdownCard record={salaryRecord} />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-gray-500 font-medium">No salary record for {getMonthName(month)} {year}</p>
            <p className="text-gray-400 text-sm mt-1">Contact the owner for salary details</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
