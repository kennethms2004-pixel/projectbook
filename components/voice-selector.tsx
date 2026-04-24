"use client";

import * as React from "react";

import { voiceCategories, voiceOptions } from "@/lib/constants";
import type { PersonaOptionKey } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type VoiceSelectorProps = {
  disabled?: boolean;
  value: PersonaOptionKey;
  onChange: (value: PersonaOptionKey) => void;
};

function VoiceOptionCard({
  checked,
  description,
  disabled,
  id,
  name,
  value,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  id: string;
  name: string;
  value: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-4 shadow-[0_10px_24px_rgba(79,63,43,0.04)] transition-colors",
        checked
          ? "border-[#b78e67] bg-[#fff9ee] ring-2 ring-[#b78e67]/25"
          : "border-[#e3d8ca] hover:border-[#ccb9a2]",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <RadioGroupItem id={id} value={value} disabled={disabled} className="mt-1" />
      <div className="space-y-1">
        <p className="text-lg font-semibold text-[#322720]">{name}</p>
        <p className="text-sm leading-6 text-[#7e7266]">{description}</p>
      </div>
    </label>
  );
}

export function VoiceSelector({
  disabled,
  value,
  onChange,
}: VoiceSelectorProps) {
  const maleVoices = voiceCategories.male as PersonaOptionKey[];
  const femaleVoices = voiceCategories.female as PersonaOptionKey[];

  return (
    <RadioGroup
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as PersonaOptionKey)}
      disabled={disabled}
      className="space-y-5"
    >
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a7e73]">
          Male Personas
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {maleVoices.map((key) => {
            const option = voiceOptions[key];
            const optionId = `persona-${key}`;

            return (
              <VoiceOptionCard
                key={key}
                checked={value === key}
                description={option.description}
                disabled={disabled}
                id={optionId}
                name={option.name}
                value={key}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a7e73]">
          Female Personas
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {femaleVoices.map((key) => {
            const option = voiceOptions[key];
            const optionId = `persona-${key}`;

            return (
              <VoiceOptionCard
                key={key}
                checked={value === key}
                description={option.description}
                disabled={disabled}
                id={optionId}
                name={option.name}
                value={key}
              />
            );
          })}
        </div>
      </div>
    </RadioGroup>
  );
}
