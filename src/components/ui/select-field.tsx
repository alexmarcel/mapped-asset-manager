"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui";

export type SelectOption = {
  value: string;
  label: string;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  className
}: {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("block text-sm font-medium", className)}>
      {label ? <span>{label}</span> : null}
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className="mt-1 flex w-full items-center justify-between gap-2 rounded-md border border-line bg-white px-3 py-2 text-left text-sm outline-none focus:border-action focus:ring-2 focus:ring-action/20">
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <ChevronDown size={16} className="shrink-0 text-slate-500" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="z-50 max-h-72 overflow-hidden rounded-md border border-line bg-white shadow-soft">
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm outline-none data-[highlighted]:bg-action/10"
                >
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <Check size={15} />
                  </Select.ItemIndicator>
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}
