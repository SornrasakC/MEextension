import React from 'react';
import type { LabelProps } from '../types';

export default function Label({ htmlFor, children }: LabelProps): JSX.Element {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-white mb-1"
    >
      {children}
    </label>
  );
} 