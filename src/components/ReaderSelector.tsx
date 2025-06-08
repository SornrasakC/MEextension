import React from 'react';
import type { ReaderSelectorProps } from '../types';

export default function ReaderSelector({
  onChange,
  value,
  options,
  className,
}: ReaderSelectorProps & { className?: string }): JSX.Element {
  return (
    <select
      id="reader"
      name="reader"
      value={value}
      onChange={onChange}
      className={`p-1 rounded-sm focus:outline-none ${className || ''}`}
    >
      {options.map((option) => (
        <option key={option.key} value={option.key}>
          {option.value}
        </option>
      ))}
    </select>
  );
} 