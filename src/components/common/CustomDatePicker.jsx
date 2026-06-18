import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày và giờ",
}) {
  const selectedDate = value ? new Date(value) : null;

  return (
    <div className="relative w-full custom-datepicker-wrapper">
      <DatePicker
        selected={selectedDate}
        onChange={(date) => {
          if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const localISO = `${year}-${month}-${day}T${hours}:${minutes}`;
            onChange({ target: { value: localISO } });
          } else {
            onChange({ target: { value: "" } });
          }
        }}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        timeCaption="Giờ"
        dateFormat="dd/MM/yyyy HH:mm"
        placeholderText={placeholder}
        portalId="datepicker-portal"
        // CÙNG NHAU TỰ CUSTOM LẠI HEADER ĐỂ CHỐNG LỆCH MŨI TÊN
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => {
          const monthNames = [
            "Tháng 1",
            "Tháng 2",
            "Tháng 3",
            "Tháng 4",
            "Tháng 5",
            "Tháng 6",
            "Tháng 7",
            "Tháng 8",
            "Tháng 9",
            "Tháng 10",
            "Tháng 11",
            "Tháng 12",
          ];
          return (
            <div className="flex items-center justify-between px-2 py-1 select-none">
              <button
                type="button"
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                className="p-1 hover:bg-[#76A084]/10 rounded-md text-muted-foreground hover:text-[#76A084] transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {monthNames[date.getMonth()]} năm {date.getFullYear()}
              </span>
              <button
                type="button"
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                className="p-1 hover:bg-[#76A084]/10 rounded-md text-muted-foreground hover:text-[#76A084] transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        }}
        className="w-full pl-3 pr-10 h-10 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-[#76A084] focus:ring-1 focus:ring-[#76A084] transition-colors block"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76A084] pointer-events-none" />
    </div>
  );
}
