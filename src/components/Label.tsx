import React from 'react';
import type { LabelProps } from '../types';

export default function Label({ 
  htmlFor, 
  children, 
  className,
  ...props 
}: LabelProps & { className?: string } & React.LabelHTMLAttributes<HTMLLabelElement>): JSX.Element {
  return (
    <label
      htmlFor={htmlFor}
      {...props}
      className={`text-lg font-bold text-white text-shadow ${className || ''}`}
    >
      {children}
    </label>
  );
} 