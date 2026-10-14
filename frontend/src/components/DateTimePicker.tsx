import ReactDatePicker from 'react-datepicker';

interface DateTimePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  placeholderText?: string;
}

export function DateTimePicker({
  selected,
  onChange,
  disabled = false,
  placeholderText = 'Select date and time',
}: DateTimePickerProps) {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="dd.MM.yyyy HH:mm"
      disabled={disabled}
      placeholderText={placeholderText}
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      calendarClassName="dark-calendar"
      popperClassName="deadline-datepicker-popper"
      popperPlacement="bottom-start"
      wrapperClassName="w-full"
      timeCaption="Время"
    />
  );
}
