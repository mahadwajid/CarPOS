import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className={`mb-4 w-full ${className}`}>
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={`input ${error ? 'border-danger-500 focus:ring-danger-500' : ''}`}
        {...props}
      />
      {error && <span className="text-xs text-danger-500 mt-1">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
