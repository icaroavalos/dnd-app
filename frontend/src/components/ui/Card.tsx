import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import styles from './Card.module.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className, ...props }) => {
  return (
    <div className={cn(styles.builderPanel, className)} {...props}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {children}
    </div>
  );
};
