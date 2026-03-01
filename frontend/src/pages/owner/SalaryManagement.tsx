import React, { useState } from 'react';
import { useGetAllWorkers, useGetSalaryRecord, useAddSalaryRecord, useUpdateSalaryRecord } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { getMonthName, getCurrentMonthYear } from '../../utils/dateUtils';
import SalaryBreakdownCard from '../../components/salary/SalaryBreakdownCard';

interface SalaryManagementProps {
  preselectedWorkerId?: string;
}

export default function SalaryManagement({ preselectedWorkerId }: SalaryManagementProps) {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const { data: workers = [] } = useGetAllWorkers();

  const [selectedWorkerId, setSelectedWorkerId] = useState(preselectedWorkerId || '');
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  // Always call hook with a string — empty string disables via enabled condition
  const { data: salaryRecord, isLoading } = useGetSalaryRecord(selectedWorkerId, month, year);
  const addSalary = useAddSalaryRecord();
  const updateSalary = useUpdateSalaryRecord();

  const [editing, setEditing] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [overrideNetPay, setOverrideNetPay] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    monthlySalary: '',
    presentDays: '',
    absentDays: '',
    cutDays: '',
    advanceAmount: '',
    carryForward: '',
    companyHolidays: '',
  });

  const selectedWorker = workers.find(w => w.workerId === selectedWorkerId);

  const startEditing = () => {
    if (salaryRecord) {
      setForm({
        monthlySalary: String(Number(salaryRecord.monthlySalary)),
        presentDays: String(Number(salaryRecord.presentDays)),
        absentDays: String(Number(salaryRecord.absentDays)),
        cutDays: String(Number(salaryRecord.cutDays)),
        advanceAmount: String(Number(salaryRecord.advanceAmount)),
        carryForward: String(Number(salaryRecord.carryForward)),
        companyHolidays: String(Number(salaryRecord.companyHolidays)),
      });
      setManualOverride(salaryRecord.manualOverride);
      setOverrideNetPay(String(Number(salaryRecord.netPay)));
    } else if (selectedWorker) {
      setForm({
        monthlySalary: String(Number(selectedWorker.monthlySalary)),
        presentDays: '',
        absentDays: '',
        cutDays: '0',
        advanceAmount: '0',
        carryForward: '0',
        companyHolidays: '0',
      });
      setManualOverride(false);
      setOverrideNetPay('');
    }
    setEditing(true);
    setError('');
  };

  const calcPreview = () => {
    const ms = Number(form.monthlySalary) || 0;
    const cd = Number(form.cutDays) || 0;
    const ch = Number(form.companyHolidays) || 0;
    const adv = Number(form.advanceAmount) || 0;
    const cf = Number(form.carryForward) || 0;
    const perDay = Math.floor(ms / 30);
    const finalDed = Math.max(0, cd - ch);
    const cutAmt = finalDed * perDay;
    const net = ms - cutAmt - adv + cf;
    return { perDay, finalDed, cutAmt, net };
  };

  const { perDay, finalDed, cutAmt, net } = calcPreview();

  const handleSave = async () => {
    if (!selectedWorkerId) return;
    setError('');
    try {
      const params = {
        workerId: selectedWorkerId,
        month,
        year,
        monthlySalary: Number(form.monthlySalary),
        presentDays: Number(form.presentDays) || 0,
        absentDays: Number(form.absentDays) || 0,
        cutDays: Number(form.cutDays) || 0,
        advanceAmount: Number(form.advanceAmount) || 0,
        carryForward: Number(form.carryForward) || 0,
        companyHolidays: Number(form.companyHolidays) || 0,
      };

      if (salaryRecord) {
        await updateSalary.mutateAsync({
          salaryId: salaryRecord.salaryId,
          ...params,
          manualOverride,
          overrideNetPay: manualOverride && overrideNetPay ? Number(overrideNetPay) : null,
        });
      } else {
        await addSalary.mutateAsync(params);
      }
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save salary record.';
      setError(msg);
    }
  };

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
      {!preselectedWorkerId && (
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salary Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage worker salary records</p>
        </div>
      )}

      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {!preselectedWorkerId && (
              <div className="flex-1 min-w-0">
                <Label className="text-sm text-gray-600 mb-1.5 block">Select Worker</Label>
                <Select value={selectedWorkerId} onValueChange={v => { setSelectedWorkerId(v); setEditing(false); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a worker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.filter(w => w.active).map(w => (
                      <SelectItem key={w.workerId} value={w.workerId}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Month</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-28 text-center">{getMonthName(month)} {year}</span>
                <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedWorkerId ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-12 text-center text-gray-400">
            Select a worker to manage their salary
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-8 text-center text-gray-400">Loading...</CardContent>
        </Card>
      ) : !editing && salaryRecord ? (
        <div className="space-y-4">
          <SalaryBreakdownCard record={salaryRecord} workerName={selectedWorker?.name} />
          <Button onClick={startEditing} variant="outline" className="w-full">
            Edit Salary Record
          </Button>
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4" />Salary record saved successfully!
            </div>
          )}
        </div>
      ) : editing ? (
        <Card className="shadow-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {salaryRecord ? 'Edit' : 'Add'} Salary — {selectedWorker?.name} — {getMonthName(month)} {year}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Monthly Salary (₹)</Label>
                <Input type="number" value={form.monthlySalary} onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Present Days</Label>
                <Input type="number" value={form.presentDays} onChange={e => setForm(f => ({ ...f, presentDays: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Absent Days</Label>
                <Input type="number" value={form.absentDays} onChange={e => setForm(f => ({ ...f, absentDays: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cut Days</Label>
                <Input type="number" value={form.cutDays} onChange={e => setForm(f => ({ ...f, cutDays: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Company Holidays</Label>
                <Input type="number" value={form.companyHolidays} onChange={e => setForm(f => ({ ...f, companyHolidays: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Advance Amount (₹)</Label>
                <Input type="number" value={form.advanceAmount} onChange={e => setForm(f => ({ ...f, advanceAmount: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Carry Forward (₹, can be negative)</Label>
                <Input type="number" value={form.carryForward} onChange={e => setForm(f => ({ ...f, carryForward: e.target.value }))} />
              </div>
            </div>

            {/* Calculated Preview */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="font-semibold text-blue-800 mb-2">Calculated Preview</div>
              <div className="flex justify-between text-gray-600">
                <span>Per Day Rate</span><span className="font-medium">₹{perDay.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Final Deductible Days</span><span className="font-medium">{finalDed}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cut Amount</span><span className="font-medium text-red-600">-₹{cutAmt.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-blue-800 border-t border-blue-200 pt-2">
                <span>Net Pay</span><span>₹{net.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Manual Override */}
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <Label className="text-sm font-medium text-amber-800">Manual Override</Label>
                <p className="text-xs text-amber-600">Override the calculated net pay</p>
              </div>
              <Switch checked={manualOverride} onCheckedChange={setManualOverride} />
            </div>
            {manualOverride && (
              <div className="space-y-1.5">
                <Label className="text-xs">Override Net Pay (₹)</Label>
                <Input
                  type="number"
                  value={overrideNetPay}
                  onChange={e => setOverrideNetPay(e.target.value)}
                  placeholder="Enter final net pay"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={addSalary.isPending || updateSalary.isPending}
                className="flex-1"
              >
                {(addSalary.isPending || updateSalary.isPending) ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-0">
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-4">No salary record for {getMonthName(month)} {year}</p>
            <Button onClick={startEditing}>
              Add Salary Record
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
