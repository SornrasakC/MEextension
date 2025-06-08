import React from 'react';
import type { ReaderSelectorProps } from '../types';

export default function ReaderSelector({
  onChange,
  value,
  options,
}: ReaderSelectorProps): JSX.Element {
  return (
    <select
      id="reader"
      name="reader"
      value={value}
      onChange={onChange}
      className="px-2 py-1 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map((option) => (
        <option key={option.key} value={option.value}>
          {option.value}
        </option>
      ))}
    </select>
  );
} 