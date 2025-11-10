"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FileSearchBar({ value, onChange, placeholder = "Search files..." }: FileSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 h-9"
      />
    </div>
  );
}
