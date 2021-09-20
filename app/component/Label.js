import React from "react";

const Label = ({ children, className, ...props }) => (
  <label
    {...props}
    className={`text-lg font-bold filter drop-shadow-seround-text ${className}`}
  >
    {children}
  </label>
);
export default Label;
