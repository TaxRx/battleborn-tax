// FilterableAccountSelect Component
// File: FilterableAccountSelect.tsx
// Purpose: Filterable dropdown for selecting accounts with search functionality

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Account } from '../../services/adminToolService';

interface FilterableAccountSelectProps {
  accounts: Account[];
  value: string;
  onChange: (accountId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const FilterableAccountSelect: React.FC<FilterableAccountSelectProps> = ({
  accounts,
  value,
  onChange,
  disabled = false,
  placeholder = "Select an account...",
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>(accounts);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find(account => account.id === value);

  // Filter and sort accounts based on search term and type priority
  useEffect(() => {
    const filtered = accounts.filter(account => {
      const searchLower = searchTerm.toLowerCase();
      return (
        account.name.toLowerCase().includes(searchLower) ||
        account.type.toLowerCase().includes(searchLower)
      );
    });

    // Sort by account type priority: Operator, Affiliate, Expert, Client
    const typePriority = {
      'operator': 1,
      'affiliate': 2,
      'expert': 3,
      'client': 4
    };

    filtered.sort((a, b) => {
      const aPriority = typePriority[a.type.toLowerCase() as keyof typeof typePriority] || 999;
      const bPriority = typePriority[b.type.toLowerCase() as keyof typeof typePriority] || 999;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same type, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    setFilteredAccounts(filtered);
  }, [accounts, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const handleSelect = (accountId: string) => {
    onChange(accountId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const getAccountTypeBadge = (type: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      client: 'bg-blue-100 text-blue-800',
      affiliate: 'bg-green-100 text-green-800',
      expert: 'bg-orange-100 text-orange-800',
      operator: 'bg-indigo-100 text-indigo-800',
    };
    
    return (
      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Value Display */}
      <div
        onClick={handleToggle}
        className={`
          w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors
          ${disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-white hover:border-gray-400'
          }
          ${isOpen 
            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' 
            : 'border-gray-300'
          }
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedAccount ? (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">
                  {selectedAccount.name}
                </span>
                {getAccountTypeBadge(selectedAccount.type)}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {selectedAccount && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
                type="button"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
              </button>
            )}
            {isOpen ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search accounts..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No accounts found
              </div>
            ) : (
              filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleSelect(account.id)}
                  className={`
                    p-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0
                    ${value === account.id 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'hover:bg-gray-50 text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium truncate">
                          {account.name}
                        </span>
                        {getAccountTypeBadge(account.type)}
                      </div>
                    </div>
                    {value === account.id && (
                      <div className="ml-2 text-blue-600">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Results Count */}
          {searchTerm && (
            <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              {filteredAccounts.length} of {accounts.length} accounts
            </div>
          )}
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="hidden"
          value={value}
          required={required}
        />
      )}
    </div>
  );
};

export default FilterableAccountSelect;