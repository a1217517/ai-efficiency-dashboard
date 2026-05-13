"use client"

import * as React from "react"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { format, subDays } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangeValue {
  startDate: string
  endDate: string
  label: string
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  className?: string
}

const presets = [
  { label: "最近7天", days: 7 },
  { label: "最近15天", days: 15 },
  { label: "最近30天", days: 30 },
  { label: "最近90天", days: 90 },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse current value into Date objects for Calendar
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    if (value.startDate && value.endDate) {
      return {
        from: new Date(value.startDate + "T00:00:00"),
        to: new Date(value.endDate + "T00:00:00"),
      }
    }
    return undefined
  })

  // Sync when value changes externally
  React.useEffect(() => {
    if (value.startDate && value.endDate) {
      setRange({
        from: new Date(value.startDate + "T00:00:00"),
        to: new Date(value.endDate + "T00:00:00"),
      })
    }
  }, [value.startDate, value.endDate])

  const applyPreset = (days: number, label: string) => {
    const end = new Date()
    const start = subDays(end, days)
    const startStr = format(start, "yyyy-MM-dd")
    const endStr = format(end, "yyyy-MM-dd")
    setRange({ from: start, to: end })
    onChange({ startDate: startStr, endDate: endStr, label })
    setOpen(false)
  }

  const applyCustom = () => {
    if (range?.from && range?.to) {
      const startStr = format(range.from, "yyyy-MM-dd")
      const endStr = format(range.to, "yyyy-MM-dd")
      onChange({
        startDate: startStr,
        endDate: endStr,
        label: `${startStr} ~ ${endStr}`,
      })
      setOpen(false)
    }
  }

  const isPresetActive = (_days: number, label: string) => {
    if (!value.label) return false
    return value.label === label
  }

  const displayText = value.label || (
    value.startDate && value.endDate
      ? `${value.startDate} ~ ${value.endDate}`
      : "选择时间范围"
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 gap-1.5 rounded-md border border-slate-700 bg-[#0f1629] px-3 text-xs text-slate-300 hover:bg-[#1a2235] hover:text-white",
            className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-cyan-400" />
          <span className="max-w-[140px] truncate">{displayText}</span>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border border-slate-700 bg-[#0f1629] p-3 text-white"
        align="end"
        sideOffset={6}
      >
        {/* Presets */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days, p.label)}
              className={cn(
                "rounded px-2 py-1 text-xs transition-colors",
                isPresetActive(p.days, p.label)
                  ? "bg-cyan-600 text-white"
                  : "bg-[#1a2235] text-slate-400 hover:bg-slate-700 hover:text-white"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Calendar */}
        <Calendar
          mode="range"
          selected={range}
          onSelect={(selected) => {
            // react-day-picker v9 may return selected as DateRange or undefined
            if (selected && "from" in selected) {
              setRange(selected as DateRange)
            } else {
              setRange(undefined)
            }
          }}
          numberOfMonths={2}
          locale={zhCN}
          className="[&_.rdp-day]:text-white [&_.rdp-day_button:hover]:bg-cyan-600/30 [&_.rdp-day_button[data-selected=true]]:bg-cyan-600 [&_.rdp-day_button[data-selected=true]]:text-white [&_.rdp-day_button[data-range-middle=true]]:bg-cyan-900/40 [&_.rdp-caption]:text-white [&_.rdp-head_cell]:text-slate-500 [&_.rdp-nav_button]:text-slate-400 [&_.rdp-nav_button:hover]:text-white"
        />

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
          <span className="text-xs text-slate-500">
            {range?.from && range?.to
              ? `${format(range.from, "yyyy-MM-dd")} ~ ${format(range.to, "yyyy-MM-dd")}`
              : "请选择日期范围"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 text-xs text-slate-400 hover:bg-[#1a2235] hover:text-white"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={applyCustom}
              disabled={!range?.from || !range?.to}
              className="h-7 bg-cyan-600 text-xs text-white hover:bg-cyan-500 disabled:opacity-40"
            >
              确定
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
