'use client';

import { NumericFormat, type NumericFormatProps } from 'react-number-format';

import { Input } from '@/components/ui/input';

type CurrencyInputProps = Omit<
  NumericFormatProps,
  | 'customInput'
  | 'thousandSeparator'
  | 'decimalSeparator'
  | 'prefix'
  | 'decimalScale'
  | 'fixedDecimalScale'
  | 'allowNegative'
>;

function CurrencyInput(props: CurrencyInputProps) {
  return (
    <NumericFormat
      customInput={Input}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      inputMode="decimal"
      {...props}
    />
  );
}

export { CurrencyInput };
