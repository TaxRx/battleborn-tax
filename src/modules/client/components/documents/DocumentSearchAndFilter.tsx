import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  FileText, 
  X, 
  ChevronDown,
  SlidersHorizontal,
  Clock,
  Star,
  FolderOpen
} from 'lucide-react';
import { documentService, DocumentFile } from '../../services/documentService';

interface DocumentSearchAndFilterProps {
  clientId: string;
  onResultsChange: (results: DocumentFile[], total: number) => void;
  onLoadingChange: (loading: boolean) => void;
  className?: string;
}

interface SearchFilters {
  query: string;
  documentType: string;
  taxYear: string;
  folderId: string;
  tags: string[];
  dateRange: {
    from: string;
    to: string;
  };
  fileSize: {
    min: number;
    max: number;
  };
  sortBy: 'name' | 'date' | 'size' | 'type' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

const DOCUMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'tax_document', label: 'Tax Documents', icon: FileText },
  { value: 'financial_statement', label: 'Financial Statements', icon: FileText },
  { value: 'contract', label: 'Contracts', icon: FileText },
  { value: 'invoice', label: 'Invoices', icon: FileText },
  { value: 'receipt', label: 'Receipts', icon: FileText },
  { value: 'bank_statement', label: 'Bank Statements', icon: FileText },
  { value: 'w2', label: 'W-2 Forms', icon: FileText },
  { value: '1099', label: '1099 Forms', icon: FileText },
  { value: 'k1', label: 'K-1 Forms', icon: FileText },
  { value: 'other', label: 'Other', icon: FileText }
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Date Modified' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'File Size' },
  { value: 'type', label: 'Document Type' }
];

const DocumentSearchAndFilter: React.FC<DocumentSearchAndFilterProps> = ({
  clientId,
  onResultsChange,
  onLoadingChange,
  className = ''
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    documentType: '',
    taxYear: '',
    folderId: '',
    tags: [],
    dateRange: {
      from: '',
      to: ''
    },
    fileSize: {
      min: 0,
      max: 100
    },
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableTags();
    loadAvailableYears();
    loadRecentSearches();
  }, [clientId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const loadAvailableTags = async () => {
    try {
      const result = await documentService.getDocuments(clientId);
      if (result.success && result.data) {
        const allTags = result.data.flatMap(doc => doc.tags);
        const uniqueTags = [...new Set(allTags)].sort();
        setAvailableTags(uniqueTags);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadAvailableYears = async () => {
    try {
      const result = await documentService.getDocuments(clientId);
      if (result.success && result.data) {
        const years = result.data
          .filter(doc => doc.tax_year)
          .map(doc => doc.tax_year!)
          .filter((year, index, self) => self.indexOf(year) === index)
          .sort((a, b) => b - a);
        setAvailableYears(years);
      }
    } catch (error) {
      console.error('Error loading years:', error);
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentDocumentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentDocumentSearches', JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!filters.query && !hasActiveFilters()) {
      // If no search query and no filters, load all documents
      const result = await documentService.getDocuments(clientId);
      if (result.success && result.data) {
        onResultsChange(result.data, result.data.length);
      }
      return;
    }

    setIsSearching(true);
    onLoadingChange(true);

    try {
      const result = await documentService.searchDocuments({
        client_id: clientId,
        query: filters.query,
        document_type: filters.documentType || undefined,
        tax_year: filters.taxYear ? parseInt(filters.taxYear) : undefined,
        folder_id: filters.folderId || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.dateRange.from || undefined,
        date_to: filters.dateRange.to || undefined,
        limit: 100
      });

      if (result.success && result.data) {
        let sortedResults = [...result.data];
        
        // Apply sorting
        sortedResults.sort((a, b) => {
          let comparison = 0;
          
          switch (filters.sortBy) {
            case 'name':
              comparison = a.original_name.localeCompare(b.original_name);
              break;
            case 'date':
              comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              break;
            case 'size':
              comparison = a.file_size - b.file_size;
              break;
            case 'type':
              comparison = a.document_type.localeCompare(b.document_type);
              break;
            case 'relevance':
            default:
              // For relevance, keep original order from search
              return 0;
          }
          
          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });

        onResultsChange(sortedResults, result.total || sortedResults.length);
        
        if (filters.query) {
          saveRecentSearch(filters.query);
        }
      }
    } catch (error) {
      console.error('Error searching documents:', error);
      onResultsChange([], 0);
    } finally {
      setIsSearching(false);
      onLoadingChange(false);
    }
  };

  const hasActiveFilters = () => {
    return filters.documentType || 
           filters.taxYear || 
           filters.folderId || 
           filters.tags.length > 0 || 
           filters.dateRange.from || 
           filters.dateRange.to;
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      documentType: '',
      taxYear: '',
      folderId: '',
      tags: [],
      dateRange: {
        from: '',
        to: ''
      },
      fileSize: {
        min: 0,
        max: 100
      },
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFilters(prev => ({ ...prev, query: suggestion }));
    setShowSuggestions(false);
  };

  const generateSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = [
      ...recentSearches.filter(search => 
        search.toLowerCase().includes(query.toLowerCase())
      ),
      ...availableTags.filter(tag => 
        tag.toLowerCase().includes(query.toLowerCase())
      ),
      ...DOCUMENT_TYPES.filter(type => 
        type.label.toLowerCase().includes(query.toLowerCase()) && type.value
      ).map(type => type.label)
    ].slice(0, 5);

    setSearchSuggestions(suggestions);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={filters.query}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, query: e.target.value }));
              generateSearchSuggestions(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute right-3 top-2 flex items-center space-x-2">
            {isSearching && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`text-gray-400 hover:text-gray-600 transition-colors ${
                showAdvancedFilters ? 'text-blue-600' : ''
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (searchSuggestions.length > 0 || recentSearches.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchSuggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-2">Suggestions</div>
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {recentSearches.length > 0 && !filters.query && (
              <div className="p-2 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">Recent Searches</div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm flex items-center space-x-2"
                  >
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.documentType}
          onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {DOCUMENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {availableYears.length > 0 && (
          <select
            value={filters.taxYear}
            onChange={(e) => setFilters(prev => ({ ...prev, taxYear: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        )}

        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            setFilters(prev => ({ 
              ...prev, 
              sortBy: sortBy as SearchFilters['sortBy'],
              sortOrder: sortOrder as SearchFilters['sortOrder']
            }));
          }}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {SORT_OPTIONS.map(option => (
            <React.Fragment key={option.value}>
              <option value={`${option.value}-desc`}>
                {option.label} ↓
              </option>
              <option value={`${option.value}-asc`}>
                {option.label} ↑
              </option>
            </React.Fragment>
          ))}
        </select>

        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Clear filters</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.from}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, from: e.target.value }
                  }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateRange.to}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, to: e.target.value }
                  }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {availableTags.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {filters.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(filters.query || hasActiveFilters()) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>Active filters:</span>
          {filters.query && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              "{filters.query}"
            </span>
          )}
          {filters.documentType && (
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              Type: {DOCUMENT_TYPES.find(t => t.value === filters.documentType)?.label}
            </span>
          )}
          {filters.taxYear && (
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              Year: {filters.taxYear}
            </span>
          )}
          {filters.tags.map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              Tag: {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentSearchAndFilter;