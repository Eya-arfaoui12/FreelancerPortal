import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";

const SelectSkillsWithSearch = ({ 
  options, 
  placeholder = "Select skills...", 
  isMulti = true, 
  onChange, 
  value = [],
  minSearchChars = 2 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Ensure value is always an array for isMulti
  const selectedValues = useMemo(() => {
    if (!isMulti) return value ? [value] : [];
    return Array.isArray(value) ? value : [];
  }, [value, isMulti]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm || searchTerm.length < minSearchChars) {
      return [];
    }
    
    const searchLower = searchTerm.toLowerCase();
    return options.filter(option => {
      // Don't show already selected options
      const isSelected = selectedValues.some(item => item.value === option.value);
      if (isSelected) return false;
      
      return option.label.toLowerCase().includes(searchLower) ||
             option.value.toLowerCase().includes(searchLower);
    });
  }, [options, searchTerm, minSearchChars, selectedValues]);

  // Handle option selection
  const handleSelect = (option) => {
    if (isMulti) {
      const newValue = [...selectedValues, option];
      onChange(newValue);
    } else {
      onChange(option);
    }
    setSearchTerm("");
    setIsOpen(false);
  };

  // Remove a selected skill
  const handleRemove = (optionToRemove, e) => {
    e.stopPropagation();
    if (isMulti) {
      const newValue = selectedValues.filter(item => item.value !== optionToRemove.value);
      onChange(newValue);
    }
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(newValue.length >= minSearchChars);
  };

  // Close dropdown
  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => searchTerm.length >= minSearchChars && setIsOpen(true)}
          onBlur={handleBlur}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   placeholder-gray-500 dark:placeholder-gray-400 text-sm"
        />
      </div>

      {/* Selected skills */}
      {isMulti && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedValues.map((skill) => (
            <div
              key={skill.value}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50
                       text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium
                       border border-indigo-200 dark:border-indigo-800"
            >
              <span>{skill.label}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(skill, e)}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors
                         hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && searchTerm.length >= minSearchChars && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto 
                      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                      rounded-lg shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                         cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg
                         text-gray-900 dark:text-white text-sm"
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
              No skills found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectSkillsWithSearch;