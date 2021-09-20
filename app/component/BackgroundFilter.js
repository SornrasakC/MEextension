import React from "react";

const BackgroundFilter = ({ children, className, ...props }) => (
  <div
    {...props}
    className={`relative h-full backdrop-filter backdrop-blur-md backdrop-brightness-70 ${className}`}
  >
    {children}
  </div>
);

export default BackgroundFilter;
