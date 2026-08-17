import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FormattedNumberInput({
  value,
  onValueChange,
  decimalScale = 0,
  suffix,
  allowDecimal = false,
  zeroWhenEmptyOnBlur = false,
  className,
  onFocus,
  onBlur,
  ...props
}: {
  value?: number | null;
  onValueChange: (value: number | undefined) => void;
  decimalScale?: number;
  suffix?: string;
  allowDecimal?: boolean;
  zeroWhenEmptyOnBlur?: boolean;
  className?: string;
} & Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "defaultValue"
>) {
  const [isFocused, setIsFocused] = useState(false);

  const input = (
    <NumericFormat
      customInput={Input}
      value={value ?? (zeroWhenEmptyOnBlur && !isFocused ? 0 : "")}
      onValueChange={({ floatValue }) => onValueChange(floatValue)}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={decimalScale}
      fixedDecimalScale={false}
      allowNegative={false}
      allowLeadingZeros={false}
      inputMode={allowDecimal ? "decimal" : "numeric"}
      className={cn(suffix && "pr-10", className)}
      {...props}
    />
  );

  if (!suffix) return input;

  return (
    <div className="relative">
      {input}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}
