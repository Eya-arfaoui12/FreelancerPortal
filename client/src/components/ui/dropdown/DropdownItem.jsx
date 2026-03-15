import React from "react";
import { Link } from "react-router-dom"; // Updated to react-router-dom

export const DropdownItem = ({
  tag = "button",
  to,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  className = "",
  children,
}) => {
  const combinedClasses = `${baseClassName} ${className}`.trim();

  const handleClick = (event) => {
    console.log('DropdownItem clicked:', { to, tag }); // Debug: Log navigation details
    if (onClick) onClick();
    if (onItemClick) onItemClick();
    // Only prevent default for button actions without a 'to' prop
    if (tag === "button" && !to) {
      event.preventDefault();
    }
  };

  if (to) {
    return (
      <Link to={to} className={combinedClasses} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={combinedClasses}>
      {children}
    </button>
  );
};