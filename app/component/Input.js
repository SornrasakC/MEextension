import React from "react";

const Input = ({ className, ...props }) => (
  <input
    {...props}
    className={`px-1 rounded-sm focus:outline-none ${className}`}
  />
);

export default Input;
