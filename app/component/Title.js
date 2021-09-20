import React from "react";

const Title = ({ children, className, ...props }) => (
  <h1
    className={`mb-4 text-3xl text-white text-stroke paint-sfm-paintOrder text-stroke-black font-bold ${className}`}
  >
    {children}
  </h1>
);

export default Title;
