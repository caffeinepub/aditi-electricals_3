import React, { useState } from 'react';
import { useGetAllWorkers, useGetSalaryRecord, useAddSalaryRecord, useUpdateSalaryRecord } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getMonthName } from '../../utils/dateUtils';

function SalaryForm({ workerId, month, year }: { workerId: string; month: number; year: number }) {
  const { data: record, isLoading } = useGetSalaryRecord(workerId, month, year);
  const addRecord = useAddSalaryRecord();
  const updateRecord = useUpdateSalaryRecord();

  const [monthlySalary, setMonthlySalary] = useState('');
  const [presentDays, setPresentDays] = useState('');
  const [absentDays, setAbsentDays] = useState('');
  const [cutDays, setCutDays] = useState('');
  const [advance, setAdvance] = useState('');
  const [carryForward, setCarryForward] = useState('');
  const [companyHolidays, setCompanyHolidays] = useState('');

  React.useEffect(() => {
    if (record) {
      setMonthlySalary(String(record.monthlySalary));
      setPresentDays(String(record.presentDays));
      setAbsentDays(String(record.absentDays));
      setCutDays(String(record.cutDays));
      setAdvance(String(record.advanceAmount));
      setCarryForward(String(record.carryForward));
      setCompanyHolidays(String(record.companyHolidays));
    } else {
      setMonthlySalary('');
      setPresentDays('');
      setAbsentDays('');
      setCutDays('0');
      setAdvance('0');
      setCarryForward('0');
      setCompanyHolidays('0');
    }
  }, [record]);

  const ms = Number(monthlySalary) || 0;
  const perDay = ms > 0 ? Math.round(ms / 30) : 0;
  const cd = Number(cutDays) || 0;
  const ch = Number(companyHolidays) || 0;
  const finalDeductible = Math.max(0, cd - ch);
  const cutAmount = finalDeductible * perDay;
  const adv = Number(advance) || 0;
  const cf = Number(carryForward) || 0;
  const netPay = ms - cutAmount - adv + cf;

  const handleSave = async () => {
    if (!monthlySalary) { toast.error('Enter monthly salary'); return; }
    const params = {
      workerId, month, year,
      monthlySalary: ms,
      presentDays: Number(presentDays) || 0,
      absentDays: Number(absentDays) || 0,
      cutDays: cd,
      advanceAmount: adv,
      carryForward: cf,
      companyHolidays: ch,
    };
    try {
      if (record) {
        await updateRecord.mutateAsync({
          salaryId: record.salaryId,
          ...params,
          manualOverride: false,
          overrideNetPay: null,
        });
        toast.success('Salary record updated');
      } else {
        await addRecord.mutateAsync(params);
        toast.success('Salary record created');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Monthly Salary (₹)</Label>
          <Input type="number" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} placeholder="e.g. 15000" />
        </div>
        <div className="space-y-2">
          <Label>Per Day Salary (auto)</Label>
          <Input value={`₹${perDay}`} readOnly className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Present Days</Label>
          <Input type="number" value={presentDays} onChange={e => setPresentDays(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Absent Days</Label>
          <Input type="number" value={absentDays} onChange={e => setAbsentDays(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cut Days (manual)</Label>
          <Input type="number" value={cutDays} onChange={e => setCutDays(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Company Holidays</Label>
          <Input type="number" value={companyHolidays} onChange={e => setCompanyHolidays(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Advance (₹)</Label>
          <Input type="number" value={advance} onChange={e => setAdvance(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Carry Forward (₹)</Label>
          <Input type="number" value={carryForward} onChange={e => setCarryForward(e.target.value)} />
        </div>
      </div>

      {/* Computed fields */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Calculated Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Final Deductible Days:</span>
          <span className="font-semibold">{finalDeductible}</span>
          <span className="text-muted-foreground">Cut Amount:</span>
          <span className="font-semibold text-red-600">-₹{cutAmount}</span>
          <span className="text-muted-foreground">Net Pay:</span>
          <span className={`font-bold text-lg ${netPay >= 0 ? 'text-green-700' : 'text-red-600'}`}>₹{netPay}</span>
        </div>
      </div>

      <Button onClick={handleSave} disabled={addRecord.isPending || updateRecord.isPending} className="w-full">
        {(addRecord.isPending || updateRecord.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {record ? 'Update Salary Record' : 'Create Salary Record'}
      </Button>
    </div>
  );
}

export default function SalaryManagement() {
  const { data: workers = [] } = useGetAllWorkers();
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

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
      <h2 className="text-2xl font-bold">Salary Management</h2>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label>Select Worker</Label>
          <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a worker..." />
            </SelectTrigger>
            <SelectContent>
              {workers.map(w => (
                <SelectItem key={w.workerId} value={w.workerId}>{w.name} ({w.workerId})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Month / Year</Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-medium w-32 text-center">{getMonthName(month)} {year}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {selectedWorkerId ? (
        <Card className="card-shadow border-0">
          <CardHeader>
            <CardTitle className="text-lg">
              {workers.find(w => w.workerId === selectedWorkerId)?.name} – {getMonthName(month)} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalaryForm workerId={selectedWorkerId} month={month} year={year} />
          </CardContent>
        </Card>
      ) : (
        <Card className="card-shadow border-0">
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a worker to view or edit their salary record.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
