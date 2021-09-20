import React from "react";

/** Options format: Object{ key: string, value: string } */
const ReaderSelector = ({ className, options = [], onChange, value }) => {
  return (
    <select
      name="reader"
      className={`p-1 rounded-sm focus:outline-none ${className}`}
      value={value}
      onChange={onChange}
    >
      {options.map((item) => (
        <option key={item.key} value={item.key}>
          {item.value}
        </option>
      ))}
    </select>
  );
};

export default ReaderSelector;
