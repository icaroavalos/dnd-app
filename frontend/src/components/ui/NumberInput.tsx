import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import styles from './NumberInput.module.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({ label, id, className, ...props }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  return (
    <div className={styles.field}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        type="number"
        className={cn(styles.input, className)}
        {...props}
      />
    </div>
  );
};
