"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { CategoryIcon, categoryIconOptions } from "@/components/category-icon";

export function CategoryIconSelect({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger className="flex w-full items-center justify-between gap-2 rounded-md border border-line bg-white px-3 py-2 text-left text-sm outline-none focus:border-action focus:ring-2 focus:ring-action/20 disabled:bg-slate-100 disabled:text-slate-400">
        <Select.Value>
          <span className="inline-flex items-center gap-2">
            <CategoryIcon name={value} size={16} />
            {value}
          </span>
        </Select.Value>
        <Select.Icon asChild>
          <ChevronDown size={16} className="shrink-0 text-slate-500" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 max-h-72 overflow-hidden rounded-md border border-line bg-white shadow-soft">
          <Select.Viewport className="grid grid-cols-2 gap-1 p-1">
            {categoryIconOptions.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm outline-none data-[highlighted]:bg-action/10"
              >
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check size={15} />
                </Select.ItemIndicator>
                <Select.ItemText>
                  <span className="inline-flex items-center gap-2">
                    <CategoryIcon name={option.value} size={16} />
                    {option.label}
                  </span>
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
