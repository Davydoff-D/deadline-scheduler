import { useState, useRef, useEffect } from 'react';

interface PriorityOption {
  value: 'low' | 'medium' | 'high';
  label: string;
  emoji: string;
  color: string;
}

const priorities: PriorityOption[] = [
  { value: 'low', label: 'Low', emoji: '🟢', color: 'from-green-600 to-emerald-600' },
  { value: 'medium', label: 'Medium', emoji: '🟡', color: 'from-yellow-600 to-amber-600' },
  { value: 'high', label: 'High', emoji: '🔴', color: 'from-red-600 to-rose-600' },
];

interface PrioritySelectProps {
  value: 'low' | 'medium' | 'high';
  onChange: (value: 'low' | 'medium' | 'high') => void;
  disabled?: boolean;
}

export function PrioritySelect({ value, onChange, disabled = false }: PrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = priorities.find((p) => p.value === value) || priorities[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{selectedOption.emoji}</span>
          <span>{selectedOption.label}</span>
        </span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[10000] w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50 overflow-hidden backdrop-blur-sm">
          {priorities.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 ${
                option.value === value
                  ? `bg-gradient-to-r ${option.color} text-white font-semibold`
                  : 'text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <span className="text-xl">{option.emoji}</span>
              <span>{option.label}</span>
              {option.value === value && (
                <svg className="ml-auto w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
