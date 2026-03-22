import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DateFilterBarProps {
  dateFrom: string;
  dateTo: string;
  search: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onFilter: () => void;
  onReset: () => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

const DateFilterBar = ({ dateFrom, dateTo, search, onDateFromChange, onDateToChange, onSearchChange, onFilter, onReset, searchPlaceholder = "Search...", children }: DateFilterBarProps) => (
  <div className="flex flex-col lg:flex-row gap-3 items-end">
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">From</label>
      <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="w-[160px] bg-secondary border-border" />
    </div>
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">To</label>
      <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="w-[160px] bg-secondary border-border" />
    </div>
    <div className="flex-1">
      <label className="text-xs text-muted-foreground mb-1 block">Name/Email/Phone</label>
      <Input placeholder={searchPlaceholder} value={search} onChange={(e) => onSearchChange(e.target.value)} className="bg-secondary border-border" />
    </div>
    <Button variant="default" size="sm" onClick={onFilter}>Filter</Button>
    <Button variant="outline" size="sm" onClick={onReset}>Reset</Button>
    {children}
  </div>
);

export default DateFilterBar;
