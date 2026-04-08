import React from 'react';

export default function Badge({ children, variant = 'gray', className = '' }) {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
    gray:    'badge-gray',
  };

  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
