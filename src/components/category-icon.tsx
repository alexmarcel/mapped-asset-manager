"use client";

import {
  Archive,
  Box,
  Camera,
  HardDrive,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  Package,
  Printer,
  Router,
  Server,
  Projector,
  Smartphone,
  TabletSmartphone,
  Wifi,
  type LucideIcon
} from "lucide-react";

export const categoryIconMap: Record<string, LucideIcon> = {
  Archive,
  Box,
  Camera,
  HardDrive,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  Package,
  Printer,
  Router,
  Server,
  Projector,
  Smartphone,
  TabletSmartphone,
  Wifi
};

export const categoryIconOptions = Object.keys(categoryIconMap).map((name) => ({
  value: name,
  label: name
}));

export function CategoryIcon({
  name,
  color = "currentColor",
  size = 18
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const Icon = categoryIconMap[name] || Package;
  return <Icon size={size} color={color} aria-hidden="true" />;
}
