import React from 'react';
import { AttendanceRecord, AttendanceStatus } from '../backend';
import { getDaysInMonth } from '../utils/dateUtils';

interface AttendanceCalendarProps {
  month: number;
  year: number;
  records: AttendanceRecord[];
  onDateClick?: (date: string, existing?: AttendanceRecord) => void;
  isOwner?: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: '#1B5E20', text: '#ffffff', label: 'Present' },
  absent: { bg: '#B71C1C', text: '#ffffff', label: 'Absent' },
  leave: { bg: '#F57F17', text: '#ffffff', label: 'Leave' },
  holiday: { bg: '#757575', text: '#ffffff', label: 'Holiday' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AttendanceCalendar({ month, year, records, onDateClick, isOwner }: AttendanceCalendarProps) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = new Date(year, month - 1, 1).getDay();
  // Convert Sunday=0 to Monday=0 offset
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);

  const recordMap: Record<string, AttendanceRecord> = {};
  records.forEach(r => {
    recordMap[r.date] = r;
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (day: number) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 pt-4 pb-2">
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: val.bg }} />
            <span className="text-xs text-gray-600">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-10 border-b border-r border-gray-50" />;
          const dateStr = getDateStr(day);
          const record = recordMap[dateStr];
          const statusKey = record ? (record.status as unknown as string) : null;
          const colors = statusKey ? STATUS_COLORS[statusKey] : null;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={day}
              onClick={() => onDateClick && onDateClick(dateStr, record)}
              disabled={!isOwner && !onDateClick}
              className={`h-10 border-b border-r border-gray-50 flex items-center justify-center text-sm font-medium transition-all relative
                ${isOwner ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
                ${isToday && !colors ? 'ring-2 ring-inset ring-blue-400' : ''}
              `}
              style={colors ? { backgroundColor: colors.bg, color: colors.text } : { color: '#374151' }}
              title={colors ? `${MONTHS[month-1]} ${day}: ${colors.label}` : `${MONTHS[month-1]} ${day}`}
            >
              {day}
              {isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
