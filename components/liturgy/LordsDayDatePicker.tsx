interface LordsDayDatePickerProps {
  date: string;
  lordsDayNumber: number;
  dateIsSunday: boolean;
  onDateChange: (date: string) => void;
}

export default function LordsDayDatePicker({
  date,
  lordsDayNumber,
  dateIsSunday,
  onDateChange,
}: LordsDayDatePickerProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-medium leading-[18px] text-text-secondary" htmlFor="liturgy-date">
        Date
      </label>
      <input
        id="liturgy-date"
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
      />
      {dateIsSunday ? (
        <span className="text-[13px] text-text-secondary">Lord’s Day {lordsDayNumber}</span>
      ) : (
        <span className="text-[13px] text-warning">
          This date is not a Sunday — it won’t get a Lord’s Day number.
        </span>
      )}
    </div>
  );
}
