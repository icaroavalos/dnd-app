import React from 'react';
import { cn } from '../../lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  locked?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, locked, className, disabled, ...props }) => {
  return (
    <label className={cn(
      "flex gap-2 items-center min-w-0 min-h-[36px] px-[9px] py-[7px] rounded-lg bg-[#080808] border border-[#2c2c2c]",
      disabled && "text-[#777] bg-panel",
      locked && "text-[#d8d8d8] bg-[#171717]",
      className
    )}>
      <input 
        type="checkbox" 
        disabled={disabled || locked} 
        {...props} 
      />
      <span className="min-w-0 flex gap-2 items-center flex-wrap leading-tight overflow-hidden">{label}</span>
    </label>
  );
};
