import React from 'react';
import type { TitleProps } from '../types';

export default function Title({ children }: TitleProps): JSX.Element {
  return (
    <h1 className="text-2xl font-bold text-white mb-4 text-center">
      {children}
    </h1>
  );
} 