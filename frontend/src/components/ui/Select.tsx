import React from 'react';
import { clsx } from 'clsx';
import styles from './Select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: [string, string][]; // [value, label]
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, helperText, className, ...props }) => {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <select className={clsx(styles.selectField, className)} {...props}>
        <option value="">Selecione...</option>
        {options.map(([val, name]) => (
          <option key={val} value={val}>
            {name}
          </option>
        ))}
      </select>
      {helperText && <p className={styles.hint}>{helperText}</p>}
    </div>
  );
};
