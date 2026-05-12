import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className, ...props }) => {
  return (
    <div 
      className={cn(
        "min-w-0 bg-panel/90 border border-line rounded-lg p-[18px] shadow-[0_18px_70px_rgba(0,0,0,0.34)]", 
        className
      )} 
      {...props}
    >
      {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
      {children}
    </div>
  );
};
