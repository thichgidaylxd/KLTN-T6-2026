import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

export function DateInput({
  value,
  onChange,
  label,
  className,
  disabled,
  min,
  max,
  onStatusChange
}: DateInputProps & { onStatusChange?: (status: 'empty' | 'valid' | 'invalid') => void }) {
  const [displayValue, setDisplayValue] = useState('');
  const [internalStatus, setInternalStatus] = useState<'empty' | 'valid' | 'invalid'>('empty');
  const nativeInputRef = useRef<HTMLInputElement>(null);

  // Sync internal display value when external value changes (YYYY-MM-DD -> DD/MM/YYYY)
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      if (year && month && day) {
        setDisplayValue(`${day}/${month}/${year}`);
        setInternalStatus('valid');
        onStatusChange?.('valid');
      }
    } else {
      setDisplayValue('');
      setInternalStatus('empty');
      onStatusChange?.('empty');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Lấy tất cả các chữ số từ input
    let digits = val.replace(/\D/g, '');
    if (digits.length > 8) digits = digits.slice(0, 8);

    // Xây dựng chuỗi hiển thị theo format dd/mm/yyyy
    let formatted = '';
    if (digits.length > 0) {
      formatted += digits.slice(0, 2);
      if (digits.length >= 2) {
        formatted += '/';
        if (digits.length > 2) {
          formatted += digits.slice(2, 4);
          if (digits.length >= 4) {
            formatted += '/';
            if (digits.length > 4) {
              formatted += digits.slice(4, 8);
            }
          }
        }
      }
    }

    setDisplayValue(formatted);

    // Xác định status
    if (digits.length === 0) {
      setInternalStatus('empty');
      onStatusChange?.('empty');
      onChange('');
    } else if (digits.length < 8) {
      setInternalStatus('empty'); // Hoặc 'partial' nếu muốn
      onStatusChange?.('empty');
      onChange('');
    } else {
      const day = digits.slice(0, 2);
      const month = digits.slice(2, 4);
      const year = digits.slice(4, 8);

      const d = parseInt(day);
      const m = parseInt(month);
      const y = parseInt(year);

      const isValid = m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900;
      if (isValid) {
        setInternalStatus('valid');
        onStatusChange?.('valid');
        onChange(`${year}-${month}-${day}`);
      } else {
        setInternalStatus('invalid');
        onStatusChange?.('invalid');
        onChange('');
      }
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const openPicker = () => {
    if (nativeInputRef.current) {
      nativeInputRef.current.showPicker();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          placeholder="dd/mm/yyyy"
          disabled={disabled}
          inputMode="numeric"
          className={cn(
            "w-full bg-slate-50 border-2 transition-all font-semibold text-slate-700 outline-none text-[12px]",
            internalStatus === 'invalid' ? "border-rose-500 bg-rose-50" : "border-transparent",
            "focus:border-indigo-500/20 focus:bg-white focus:ring-4 focus:ring-indigo-500/5",
            "rounded-xl py-2 pl-2 pr-8 placeholder:text-slate-400 disabled:opacity-50",
            "relative z-10" // Đảm bảo nằm trên input ẩn
          )}
        />

        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-500 transition-colors z-20"
        >
          <CalendarIcon size={14} />
        </button>

        {/* Hidden native input for the calendar picker */}
        <input
          ref={nativeInputRef}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={handleNativeChange}
          className="absolute inset-0 opacity-0 pointer-events-none z-0"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
