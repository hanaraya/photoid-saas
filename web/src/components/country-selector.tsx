'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';
import { getGroupedStandards, STANDARDS, type PhotoStandard } from '@/lib/photo-standards';

interface CountrySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CountrySelector({ value, onValueChange }: CountrySelectorProps) {
  const grouped = getGroupedStandards();
  const selected = STANDARDS[value];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full bg-card border-border">
        <span className="truncate">
          {selected
            ? `${selected.flag} ${selected.name} (${selected.description})`
            : 'Select photo standard'}
        </span>
      </SelectTrigger>
      <SelectContent className="bg-card border-border max-h-80">
        {Object.entries(grouped).map(([group, standards]) => (
          <SelectGroup key={group}>
            <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {group}
            </SelectLabel>
            {standards.map((std: PhotoStandard) => (
              <SelectItem key={std.id} value={std.id} textValue={`${std.flag} ${std.name}`}>
                {std.flag} {std.name} ({std.description})
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
