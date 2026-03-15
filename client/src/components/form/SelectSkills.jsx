import { useState, useRef, useEffect } from "react";

const SelectSkills = ({
  options,
  placeholder = "Select skills",
  onChange,
  className = "",
  defaultValue = [],
  isMulti = false,
}) => {
  const [selectedValues, setSelectedValues] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

 const handleSelect = (value) => {
  let newValues;
  if (isMulti) {
    if (selectedValues.includes(value)) {
      newValues = selectedValues.filter(v => v !== value);
    } else {
      newValues = [...selectedValues, value];
    }
  } else {
    newValues = [value];
    setIsOpen(false);
  }
  
  setSelectedValues(newValues);
  
  // CORRECTION : Envoyer seulement les valeurs, pas les objets complets
  onChange(isMulti ? newValues : newValues[0]);
};

 const removeSkill = (value, e) => {
  e.stopPropagation();
  const newValues = selectedValues.filter(v => v !== value);
  setSelectedValues(newValues);
  
  // CORRECTION : Envoyer seulement les valeurs, pas les objets complets
  onChange(newValues);
};

  const getSelectedLabels = () => {
    return selectedValues.map(value => {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`min-h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 flex flex-wrap gap-2 items-center cursor-pointer ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          getSelectedLabels().map((label, index) => (
            <span
              key={index}
              className="bg-brand-100 text-brand-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center"
            >
              {label}
              {isMulti && (
                <button
                  type="button"
                  onClick={(e) => removeSkill(selectedValues[index], e)}
                  className="ml-1 text-brand-600 hover:text-brand-800"
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-900 dark:border-gray-700 max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                selectedValues.includes(option.value)
                  ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                  : "text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectSkills;