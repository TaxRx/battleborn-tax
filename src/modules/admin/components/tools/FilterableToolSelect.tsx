// FilterableToolSelect Component
// File: FilterableToolSelect.tsx
// Purpose: Filterable dropdown for selecting tools with search functionality

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, XMarkIcon, CogIcon } from '@heroicons/react/24/outline';
import { Tool } from '../../services/adminToolService';

interface FilterableToolSelectProps {
  tools: Tool[];
  value: string;
  onChange: (toolId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const FilterableToolSelect: React.FC<FilterableToolSelectProps> = ({
  tools,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a tool...",
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTools, setFilteredTools] = useState<Tool[]>(tools);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedTool = tools.find(tool => tool.id === value);

  // Filter tools based on search term
  useEffect(() => {
    const filtered = tools.filter(tool => {
      const searchLower = searchTerm.toLowerCase();
      return (
        tool.name.toLowerCase().includes(searchLower) ||
        tool.slug.toLowerCase().includes(searchLower) ||
        (tool.description && tool.description.toLowerCase().includes(searchLower))
      );
    });

    // Sort alphabetically by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredTools(filtered);
  }, [tools, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const handleSelectTool = (toolId: string) => {
    onChange(toolId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredTools.length > 0) {
      e.preventDefault();
      handleSelectTool(filteredTools[0].id);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main button */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        disabled={disabled}
        className={`relative w-full cursor-pointer rounded-lg border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'
        } ${
          required && !value ? 'border-red-300' : 'border-gray-300'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedTool ? (
              <div className="flex items-center space-x-2">
                <CogIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-900 truncate">
                  {selectedTool.name}
                </span>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {value && !disabled && (
              <button
                onClick={handleClearSelection}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Clear selection"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            <ChevronDownIcon 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder="Search tools..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Tool list */}
          <div className="max-h-48 overflow-auto">
            {filteredTools.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No tools found
              </div>
            ) : (
              filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                    value === tool.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <CogIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">
                          {tool.name}
                        </span>
                      </div>
                      {tool.description && (
                        <div className="text-sm text-gray-500 truncate mt-1">
                          {tool.description}
                        </div>
                      )}
                    </div>
                    {value === tool.id && (
                      <div className="ml-2 text-blue-600">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterableToolSelect;