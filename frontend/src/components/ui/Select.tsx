import React from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: [string, string][]; // [value, label]
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, helperText, className, id, ...props }) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={selectId} className="text-[#e8e8e8] font-extrabold text-[0.88rem]">{label}</label>
      <select 
        id={selectId}
        className={cn(
          "w-full min-h-[42px] text-ink bg-bg border border-[#373737] rounded-lg px-2.5 py-[9px]", 
          className
        )} 
        {...props}
      >
        <option value="">Selecione...</option>
        {options.map(([val, name]) => (
          <option key={val} value={val}>
            {name}
          </option>
        ))}
      </select>
      {helperText && <p className="m-0 text-muted leading-[1.45]">{helperText}</p>}
    </div>
  );
};
