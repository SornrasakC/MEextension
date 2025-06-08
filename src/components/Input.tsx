import React from 'react';
import type { InputProps } from '../types';

export default function Input({ className, ...props }: InputProps): JSX.Element {
  return (
    <input
      {...props}
      className={`px-2 py-1 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ''}`}
    />
  );
} 