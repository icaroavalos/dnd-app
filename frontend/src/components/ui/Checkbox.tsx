import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import styles from './Checkbox.module.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  locked?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, locked, className, disabled, ...props }) => {
  return (
    <label className={cn(
      styles.container, 
      disabled && styles.disabled,
      locked && styles.locked,
      className
    )}>
      <input 
        type="checkbox" 
        disabled={disabled || locked} 
        {...props} 
      />
      <span className={styles.checkboxLabel}>{label}</span>
    </label>
  );
};
