import React from 'react';
import type { InputProps } from '../types';

export default function Input({ className, ...props }: InputProps): JSX.Element {
  return (
    <input
      {...props}
      className={`px-1 rounded-sm focus:outline-none ${className || ''}`}
    />
  );
} 