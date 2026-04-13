'use client';

import { PatternFormat, type PatternFormatProps } from 'react-number-format';

import { Input } from '@/components/ui/input';

type PhoneInputProps = Omit<PatternFormatProps, 'format' | 'customInput'>;

function PhoneInput(props: PhoneInputProps) {
  return (
    <PatternFormat
      customInput={Input}
      format="(##) #####-####"
      mask="_"
      inputMode="numeric"
      {...props}
    />
  );
}

export { PhoneInput };
