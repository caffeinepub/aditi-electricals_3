import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../backend';
import { getDaysInMonth, getFirstDayOfMonth, getMonthName } from '../utils/dateUtils';

interface Holiday {
  date: string;
  name: string;
}

interface AttendanceCalendarProps {
  workerId: string;
  records: AttendanceRecord[];
  holidays?: Holiday[];
  onDateClick?: (date: string, existingRecord?: AttendanceRecord) => void;
  isOwner?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  present: 'status-present',
  absent: 'status-absent',
  leave: 'status-leave',
  holiday: 'status-holiday',
};

const STATUS_LABELS: Record<string, string> = {
  present: 'P',
  absent: 'A',
  leave: 'L',
  holiday: 'H',
};

export default function AttendanceCalendar({
  workerId,
  records,
  holidays = [],
  onDateClick,
  isOwner = false,
}: AttendanceCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const recordMap: Record<string, AttendanceRecord> = {};
  records.forEach(r => {
    if (r.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) {
      recordMap[r.date] = r;
    }
  });

  const holidaySet = new Set(holidays.map(h => h.date));

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    if (!onDateClick || !isOwner) return;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateClick(dateStr, recordMap[dateStr]);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Count stats
  const presentCount = records.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month && r.status === AttendanceStatus.present;
  }).length;
  const absentCount = records.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month && r.status === AttendanceStatus.absent;
  }).length;
  const leaveCount = records.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month && r.status === AttendanceStatus.leave;
  }).length;

  return (
    <div className="bg-card rounded-xl card-shadow p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-lg">{getMonthName(month)} {year}</h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-xs px-2 py-1 rounded-full status-present font-medium">P: {presentCount}</span>
        <span className="text-xs px-2 py-1 rounded-full status-absent font-medium">A: {absentCount}</span>
        <span className="text-xs px-2 py-1 rounded-full status-leave font-medium">L: {leaveCount}</span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const record = recordMap[dateStr];
          const isHoliday = holidaySet.has(dateStr) && !record;
          const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          let cellClass = 'relative flex flex-col items-center justify-center rounded-lg aspect-square text-sm transition-all ';
          let statusLabel = '';

          if (record) {
            const statusKey = record.status as unknown as string;
            cellClass += STATUS_STYLES[statusKey] || 'bg-muted';
            statusLabel = STATUS_LABELS[statusKey] || '';
          } else if (isHoliday) {
            cellClass += 'status-holiday';
            statusLabel = 'H';
          } else {
            cellClass += 'bg-muted/30 text-foreground';
          }

          if (isOwner) {
            cellClass += ' cursor-pointer hover:opacity-80 hover:scale-105';
          }

          if (isToday && !record && !isHoliday) {
            cellClass += ' ring-2 ring-primary ring-offset-1';
          }

          return (
            <button
              key={day}
              className={cellClass}
              onClick={() => handleDayClick(day)}
              disabled={!isOwner}
            >
              <span className="font-medium text-xs">{day}</span>
              {statusLabel && <span className="text-xs font-bold leading-none">{statusLabel}</span>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm status-present inline-block" />
          <span className="text-xs text-muted-foreground">Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm status-absent inline-block" />
          <span className="text-xs text-muted-foreground">Absent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm status-leave inline-block" />
          <span className="text-xs text-muted-foreground">Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm status-holiday inline-block" />
          <span className="text-xs text-muted-foreground">Holiday</span>
        </div>
      </div>
    </div>
  );
}
