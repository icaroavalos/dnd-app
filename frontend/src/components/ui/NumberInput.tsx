import React from 'react';
import { cn } from '../../lib/utils';

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({ label, id, className, ...props }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  return (
    <div className="grid gap-1.5">
      {label && <label htmlFor={inputId} className="text-[#e8e8e8] font-extrabold text-[0.88rem]">{label}</label>}
      <input
        id={inputId}
        type="number"
        className={cn(
          "w-full min-h-[42px] text-ink bg-bg border border-[#373737] rounded-lg px-2.5 py-[9px]",
          className
        )}
        {...props}
      />
    </div>
  );
};
