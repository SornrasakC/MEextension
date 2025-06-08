import React from 'react';
import type { TitleProps } from '../types';

export default function Title({ 
  children, 
  className,
  ...props 
}: TitleProps & { className?: string } & React.HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
    <h1
      {...props}
      className={`mb-4 text-3xl text-white text-stroke paint-sfm-paintOrder text-stroke-black font-bold ${className || ''}`}
    >
      {children}
    </h1>
  );
} 