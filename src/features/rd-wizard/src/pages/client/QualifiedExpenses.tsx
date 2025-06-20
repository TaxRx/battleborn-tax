import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon,
  UsersIcon,
  BriefcaseIcon,
  CubeIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  DocumentTextIcon,
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { cn } from '../../utils/styles';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatting';
import YearSelector from '../../components/common/YearSelector';
import useBusinessStore from '../../store/businessStore';
import useExpenseStore from '../../store/expenseStore';
import useActivitiesStore from '../../store/activitiesStore';
import ContractorExpenseForm from '../../components/expenses/ContractorExpenseForm';
import { SupplyExpenseForm } from '../../components/expenses/SupplyExpenseForm';
import Modal from '../../components/common/Modal';
import { ContractorExpense, SupplyExpense } from '../../types/index';
import useStaffStore from '../../store/staffStore';
import Input from '../../components/common/Input';
import { EmployeeRole } from '../../types/staff';
import useCreditStore from '../../store/creditStore';
import { toast } from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { getBusinessesForUser } from '../../services/businessService';
import {
  getContractorExpensesForBusiness,
  getSupplyExpensesForBusiness,
  createContractorExpense,
  updateContractorExpense,
  deleteContractorExpense,
  createSupplyExpense,
  updateSupplyExpense,
  deleteSupplyExpense
} from '../../services/expenseService';
import {
  getEmployeesForBusiness,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeActivityPercentage,
  updateEmployeeSubcomponentPercentage
} from '../../services/employeeService';
import { createChangelogEntry } from '../../services/changelogService';

interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  annualWage: number;
  isBusinessOwner: boolean;
  yearlyActivities: {
    [year: number]: {
      [activityId: string]: {
        percentage: number;
        isSelected: boolean;
        subcomponents: {
          [subcomponentId: string]: {
            percentage: number;
            isSelected: boolean;
            roleDescription?: string;
          }
        }
      }
    }
  }
}

// Calculate total allocation percentage for an employee in a given year
const calculateEmployeeAllocation = (employee: Employee, year: number): number => {
  const yearActivities = employee.yearlyActivities[year] || {};
  let totalAllocation = 0;

  Object.values(yearActivities).forEach(activity => {
    if (activity?.isSelected) {
      Object.values(activity.subcomponents || {}).forEach(subcomponent => {
        if (subcomponent?.isSelected) {
          totalAllocation += subcomponent.percentage || 0;
        }
      });
    }
  });

  return Number(totalAllocation.toFixed(2));
};

type ExpenseTab = 'wages' | 'contractors' | 'supplies';

const employeeRoles: EmployeeRole[] = [
  EmployeeRole.RESEARCH_LEADER,
  EmployeeRole.CLINICIAN,
  EmployeeRole.MIDLEVEL,
  EmployeeRole.CLINICAL_ASSISTANT
];

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="font-['DM_Serif_Display'] text-2xl text-gray-900 mb-6">{children}</h2>
);

const QualifiedExpenses: React.FC = () => {
  const navigate = useNavigate();
  const { yearStarted, availableYears, generateAvailableYears } = useBusinessStore();
  const { user } = useUser();
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null); // fallback: not used
  const [business, setBusiness] = useState<any>(null);
  const [contractorExpenses, setContractorExpenses] = useState<any[]>([]);
  const [supplyExpenses, setSupplyExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize availableYears if empty
  useEffect(() => {
    if (availableYears.length === 0) {
      generateAvailableYears();
    }
  }, [availableYears.length, generateAvailableYears]);

  const [selectedTab, setSelectedTab] = useState<ExpenseTab>('wages');
  const [selectedYear, setSelectedYear] = useState(() => {
    if (availableYears && availableYears.length > 0) {
      return Math.max(...availableYears);
    }
    return new Date().getFullYear();
  });

  // Update selectedYear when availableYears changes
  useEffect(() => {
    if (availableYears && availableYears.length > 0) {
      setSelectedYear(Math.max(...availableYears));
    }
  }, [availableYears]);

  const expenseStore = useExpenseStore();
  const activitiesStore = useActivitiesStore();
  const staffStore = useStaffStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expandedEmployees, setExpandedEmployees] = useState<{ [employeeId: string]: boolean }>({});
  const [expandedActivities, setExpandedActivities] = useState<{ [employeeId: string]: { [activityId: string]: boolean } }>({});
  const [newEmployee, setNewEmployee] = useState<{ name: string; role: EmployeeRole; isBusinessOwner: boolean; annualWage: number }>({ 
    name: '', 
    role: EmployeeRole.CLINICIAN, 
    isBusinessOwner: false, 
    annualWage: 0 
  });

  // Modal state
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [editingContractor, setEditingContractor] = useState<ContractorExpense | undefined>(undefined);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [editingSupply, setEditingSupply] = useState<SupplyExpense | undefined>(undefined);

  // Get all selected subcomponents for the selected year
  const selectedActivities = activitiesStore.selectedActivities.filter(a => a.year === selectedYear);
  const allSubcomponents = selectedActivities.flatMap(a => a.subcomponents);

  // Create lookup maps for activity and subcomponent names
  const activityNameMap = Object.fromEntries(
    selectedActivities.map(a => [a.id, a.name])
  );
  const subcomponentNameMap: Record<string, string> = {};
  selectedActivities.forEach(activity => {
    activity.subcomponents.forEach(sub => {
      subcomponentNameMap[sub.id] = sub.name;
    });
  });

  // Get contractor and supply expenses for selected year with improved filtering
  const [contractorSearchTerm, setContractorSearchTerm] = useState('');
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [contractorSortConfig, setContractorSortConfig] = useState<{
    key: keyof ContractorExpense;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [supplySortConfig, setSupplySortConfig] = useState<{
    key: keyof SupplyExpense;
    direction: 'asc' | 'desc';
  } | null>(null);

  const filteredContractorExpenses = React.useMemo(() => {
    let filtered = Object.values(expenseStore.contractorExpenses)
      .filter(expense => expense.year === selectedYear);

    if (contractorSearchTerm) {
      const searchLower = contractorSearchTerm.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.contractorName.toLowerCase().includes(searchLower) ||
        expense.role.toLowerCase().includes(searchLower) ||
        subcomponentNameMap[expense.subcomponentId]?.toLowerCase().includes(searchLower)
      );
    }

    if (contractorSortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[contractorSortConfig.key];
        const bValue = b[contractorSortConfig.key];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return contractorSortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return contractorSortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [expenseStore.contractorExpenses, selectedYear, contractorSearchTerm, contractorSortConfig, subcomponentNameMap]);

  const filteredSupplyExpenses = React.useMemo(() => {
    let filtered = Object.values(expenseStore.supplyExpenses)
      .filter(expense => expense.year === selectedYear);

    if (supplySearchTerm) {
      const searchLower = supplySearchTerm.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.supplierName.toLowerCase().includes(searchLower) ||
        expense.vendor.toLowerCase().includes(searchLower) ||
        expense.category.toLowerCase().includes(searchLower) ||
        subcomponentNameMap[expense.subcomponentId]?.toLowerCase().includes(searchLower)
      );
    }

    if (supplySortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[supplySortConfig.key];
        const bValue = b[supplySortConfig.key];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return supplySortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return supplySortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [expenseStore.supplyExpenses, selectedYear, supplySearchTerm, supplySortConfig, subcomponentNameMap]);

  // Helper function to handle contractor sort
  const handleContractorSort = (key: keyof ContractorExpense) => {
    setContractorSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Helper function to handle supply sort
  const handleSupplySort = (key: keyof SupplyExpense) => {
    setSupplySortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Helper function to calculate total expenses by subcomponent
  const calculateTotalExpensesBySubcomponent = (expenses: (ContractorExpense | SupplyExpense)[]) => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const tabs = [
    { id: 'wages', name: 'Wages', icon: UsersIcon },
    { id: 'contractors', name: 'Contractors', icon: BriefcaseIcon },
    { id: 'supplies', name: 'Supplies', icon: CubeIcon }
  ] as const;

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmployee.name.trim() && business) {
      const role = newEmployee.isBusinessOwner ? EmployeeRole.RESEARCH_LEADER : newEmployee.role;
      await handleCreateEmployee({
        name: newEmployee.name,
        role,
        isBusinessOwner: newEmployee.isBusinessOwner,
        annualWage: newEmployee.annualWage,
        yearlyActivities: {}
      });
      setNewEmployee({ name: '', role: EmployeeRole.CLINICIAN, isBusinessOwner: false, annualWage: 0 });
    }
  };

  // Add helper function to initialize activities for a year
  const initializeActivitiesForYear = (year: number) => {
    const activities = activitiesStore.selectedActivities.filter(a => a.year === year);
    return activities.reduce((acc, activity) => {
      const subcomponents = activity.subcomponents.reduce((subAcc, sub) => ({
        ...subAcc,
        [sub.id]: {
          percentage: 0,
          isSelected: true,
          roleDescription: sub.description || ''
        }
      }), {});
      return {
        ...acc,
        [activity.id]: {
          percentage: 0,
          isSelected: true,
          subcomponents
        }
      };
    }, {});
  };

  // Helper function for deep comparison
  function deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  useEffect(() => {
    let changed = false;
    const updatedEmployees = employees.map(employee => {
      const updated = { ...employee };
      if (selectedActivities.length === 0) {
        if (employee.yearlyActivities[selectedYear] && Object.keys(employee.yearlyActivities[selectedYear]).length > 0) {
          updated.yearlyActivities = { ...employee.yearlyActivities, [selectedYear]: {} };
          changed = true;
        }
      } else {
        // Ensure all selected activities are present in yearlyActivities
        let yearly = { ...employee.yearlyActivities[selectedYear] };
        selectedActivities.forEach(activity => {
          if (!yearly[activity.id]) {
            yearly[activity.id] = {
              percentage: 0,
              isSelected: true,
              subcomponents: activity.subcomponents.reduce((acc, sub) => {
                acc[sub.id] = {
                  percentage: 0,
                  isSelected: true,
                  roleDescription: sub.description || ''
                };
                return acc;
              }, {} as any)
            };
            changed = true;
          }
        });
        // Remove any activities from yearlyActivities that are no longer selected
        Object.keys(yearly).forEach(activityId => {
          if (!selectedActivities.find(a => a.id === activityId)) {
            delete yearly[activityId];
            changed = true;
          }
        });
        if (!deepEqual(yearly, employee.yearlyActivities[selectedYear])) {
          updated.yearlyActivities = { ...employee.yearlyActivities, [selectedYear]: yearly };
          changed = true;
        }
      }
      return updated;
    });
    if (changed && !deepEqual(updatedEmployees, employees)) {
      setEmployees(updatedEmployees);
    }
  }, [selectedActivities, selectedYear]);

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  const toggleActivityExpansionLocal = (employeeId: string, activityId: string) => {
    setExpandedActivities(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [activityId]: !prev[employeeId]?.[activityId]
      }
    }));
  };

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'role' | 'annualWage' | 'applied';
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedEmployees = React.useMemo(() => {
    if (!sortConfig) return employees;

    return [...employees].sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'role') {
        return sortConfig.direction === 'asc'
          ? a.role.localeCompare(b.role)
          : b.role.localeCompare(a.role);
      }
      if (sortConfig.key === 'annualWage') {
        return sortConfig.direction === 'asc'
          ? a.annualWage - b.annualWage
          : b.annualWage - a.annualWage;
      }
      if (sortConfig.key === 'applied') {
        const aTotal = Object.values(a.yearlyActivities[selectedYear] || {})
          .reduce((sum, activity) => sum + (activity.percentage || 0), 0);
        const bTotal = Object.values(b.yearlyActivities[selectedYear] || {})
          .reduce((sum, activity) => sum + (activity.percentage || 0), 0);
        return sortConfig.direction === 'asc' ? aTotal - bTotal : bTotal - aTotal;
      }
      return 0;
    });
  }, [employees, sortConfig, selectedYear]);

  const requestSort = (key: 'name' | 'role' | 'annualWage' | 'applied') => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showTotals, setShowTotals] = useState(false);

  // Calculate totals
  const totals = React.useMemo(() => {
    const result = {
      totalWages: 0,
      totalAppliedWages: 0,
      totalContractors: 0,
      totalAppliedContractors: 0,
      totalSupplies: 0,
      totalAppliedSupplies: 0
    };

    employees.forEach(employee => {
      result.totalWages += employee.annualWage;
      const totalAllocationPercent = calculateEmployeeAllocation(employee, selectedYear);
      result.totalAppliedWages += employee.annualWage * (totalAllocationPercent / 100);
    });

    filteredContractorExpenses.forEach(expense => {
      result.totalContractors += expense.amount;
      result.totalAppliedContractors += expense.amount * (expense.researchPercentage / 100);
    });

    filteredSupplyExpenses.forEach(expense => {
      result.totalSupplies += expense.amount;
      result.totalAppliedSupplies += expense.amount * (expense.researchPercentage / 100);
    });

    return result;
  }, [employees, filteredContractorExpenses, filteredSupplyExpenses, selectedYear]);

  // Filter employees based on search and role
  const filteredEmployees = React.useMemo(() => {
    return sortedEmployees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [sortedEmployees, searchTerm, roleFilter]);

  // Update percentage display in the component
  const renderPercentageCell = (percentage: number) => (
    <div className="text-right font-medium">
      {percentage !== undefined && percentage !== null ? `${Number(percentage).toFixed(2)}%` : '0.00%'}
    </div>
  );

  const renderCurrencyCell = (amount: number) => (
    <div className="text-right font-medium">
      {amount !== undefined && amount !== null ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0'}
    </div>
  );

  // Update the employee table columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (employee: Employee) => employee.name,
    },
    {
      key: 'role',
      header: 'Role',
      render: (employee: Employee) => employee.role,
    },
    {
      key: 'annualWage',
      header: 'Annual Wage',
      render: (employee: Employee) => renderCurrencyCell(employee.annualWage),
    },
    {
      key: 'applied',
      header: 'Applied %',
      render: (employee: Employee) => renderPercentageCell(
        calculateEmployeeAllocation(employee, selectedYear)
      ),
    }
  ];

  const SortableHeader = <T extends Record<string, any>>({ 
    label, 
    sortKey, 
    currentSort, 
    onSort 
  }: {
    label: string;
    sortKey: keyof T;
    currentSort: { key: keyof T; direction: 'asc' | 'desc' } | null;
    onSort: (key: keyof T) => void;
  }) => {
    const isSorted = currentSort?.key === sortKey;
    
    return (
      <th
        scope="col"
        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer group"
        onClick={() => onSort(sortKey)}
      >
        <div className="flex items-center">
          <span>{label}</span>
          <span className={cn(
            "ml-2 flex-none rounded",
            isSorted ? "text-gray-900" : "invisible group-hover:visible text-gray-400"
          )}>
            {isSorted && currentSort.direction === 'desc' ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </span>
        </div>
      </th>
    );
  };

  useEffect(() => {
    // Recalculate/refresh when activities change
    staffStore.recalculateWages && staffStore.recalculateWages();
  }, [activitiesStore.selectedActivities, selectedYear]);

  // Helper functions for formatting and parsing currency
  function formatCurrencyInput(value: string | number) {
    if (typeof value === 'number') value = value.toString();
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    return parseInt(cleaned, 10).toLocaleString('en-US');
  }
  function parseCurrencyInput(value: string) {
    return parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
  }

  // Add manual refresh button next to Show Totals
  const handleManualRefresh = () => {
    staffStore.recalculateWages && staffStore.recalculateWages();
    // Optionally, trigger any other sync logic needed
  };

  const creditStore = useCreditStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Recalculate wages and update UI
      if (staffStore.recalculateWages) {
        staffStore.recalculateWages();
      }
      // Force update of activities
      activitiesStore.updateQualifiedExpenses();
      // Update credit calculation
      creditStore.setQualifiedExpenses(staffStore.calculateTotalQualifiedWages());
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      // Show success toast
      toast.success('Calculations refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh calculations');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch business, expenses, and employees
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    setLoading(true);
    getBusinessesForUser(userId).then(({ data, error }) => {
      if (error) {
        setLoading(false);
        toast.error(error);
        return;
      }
      if (data && data.length > 0) {
        setBusiness(data[0]);
        Promise.all([
          getContractorExpensesForBusiness(data[0].id),
          getSupplyExpensesForBusiness(data[0].id),
          getEmployeesForBusiness(data[0].id)
        ]).then(([contractors, supplies, employees]) => {
          setContractorExpenses(contractors?.data || []);
          setSupplyExpenses(supplies?.data || []);
          setEmployees(employees?.data || []);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [user]);

  // CRUD handlers for employees
  const handleCreateEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    if (!business) return;
    const res = await createEmployee({ ...employee, business_id: business.id });
    const data = res && 'data' in res ? res.data : null;
    const error = res && 'error' in res ? (res as any).error : null;
    if (!error && data) {
      setEmployees(prev => Array.isArray(data) ? [...prev, ...data] : [...prev, data]);
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'employee_created',
          details: `Employee created for business ${business.id}`,
          metadata: { business_id: business.id, employee: employee }
        });
      }
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    if (!business) return;
    const res = await updateEmployee(id, updates);
    const error = res && typeof res === 'object' && 'error' in res ? (res as any).error : null;
    if (!error) {
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'employee_updated',
          details: `Employee updated for business ${business.id}`,
          metadata: { business_id: business.id, update: { id, ...updates } }
        });
      }
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!business) return;
    const res = await deleteEmployee(id);
    const error = res && typeof res === 'object' && 'error' in res ? (res as any).error : null;
    if (!error) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'employee_deleted',
          details: `Employee deleted for business ${business.id}`,
          metadata: { business_id: business.id, id }
        });
      }
    }
  };

  const handleUpdateActivityPercentage = async (
    employeeId: string,
    year: number,
    activityId: string,
    percentage: number
  ) => {
    if (!business) return;
    const res = await updateEmployeeActivityPercentage(employeeId, year, activityId, percentage);
    const error = res && 'error' in res ? res.error : null;
    if (!error) {
      setEmployees(prev => prev.map(employee => {
        if (employee.id === employeeId) {
          const updated = { ...employee };
          if (!updated.yearlyActivities[year]) {
            updated.yearlyActivities[year] = {};
          }
          if (!updated.yearlyActivities[year][activityId]) {
            updated.yearlyActivities[year][activityId] = {
              percentage: 0,
              isSelected: true,
              subcomponents: {}
            };
          }
          updated.yearlyActivities[year][activityId].percentage = percentage;
          return updated;
        }
        return employee;
      }));
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'employee_activity_percentage_updated',
          details: `Employee activity percentage updated for business ${business.id}`,
          metadata: { business_id: business.id, employeeId, year, activityId, percentage }
        });
      }
    }
  };

  const handleUpdateSubcomponentPercentage = async (
    employeeId: string,
    year: number,
    activityId: string,
    subcomponentId: string,
    percentage: number
  ) => {
    if (!business) return;
    const res = await updateEmployeeSubcomponentPercentage(
      employeeId,
      year,
      activityId,
      subcomponentId,
      percentage
    );
    const error = res && 'error' in res ? res.error : null;
    if (!error) {
      setEmployees(prev => prev.map(employee => {
        if (employee.id === employeeId) {
          const updated = { ...employee };
          if (!updated.yearlyActivities[year]) {
            updated.yearlyActivities[year] = {};
          }
          if (!updated.yearlyActivities[year][activityId]) {
            updated.yearlyActivities[year][activityId] = {
              percentage: 0,
              isSelected: true,
              subcomponents: {}
            };
          }
          if (!updated.yearlyActivities[year][activityId].subcomponents[subcomponentId]) {
            updated.yearlyActivities[year][activityId].subcomponents[subcomponentId] = {
              percentage: 0,
              isSelected: true
            };
          }
          updated.yearlyActivities[year][activityId].subcomponents[subcomponentId].percentage = percentage;
          return updated;
        }
        return employee;
      }));
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'employee_subcomponent_percentage_updated',
          details: `Employee subcomponent percentage updated for business ${business.id}`,
          metadata: { business_id: business.id, employeeId, year, activityId, subcomponentId, percentage }
        });
      }
    }
  };

  // CRUD handlers for contractor expenses
  const handleCreateContractorExpense = async (expense: any) => {
    if (!business) return;
    const res = await createContractorExpense({ ...expense, business_id: business.id });
    const data = res && 'data' in res ? res.data : null;
    const error = res && typeof res === 'object' && 'error' in res ? (res as any).error : null;
    if (!error && data) {
      setContractorExpenses((prev) => Array.isArray(data) ? [...prev, ...data] : [...prev, data]);
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'contractor_expense_created',
          details: expense,
          metadata: { business_id: business.id }
        });
      }
    }
  };

  const handleUpdateContractorExpense = async (id: string, updates: any) => {
    if (!business) return;
    const res = await updateContractorExpense(id, updates);
    const error = res && typeof res === 'object' && 'error' in res ? (res as any).error : null;
    if (!error) {
      setContractorExpenses((prev) => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'contractor_expense_updated',
          details: `Contractor expense updated for business ${business.id}`,
          metadata: { business_id: business.id, update: { id, ...updates } }
        });
      }
    }
  };

  const handleDeleteContractorExpense = async (id: string) => {
    if (!business) return;
    const res = await deleteContractorExpense(id);
    const error = res && typeof res === 'object' && 'error' in res ? (res as any).error : null;
    if (!error) {
      setContractorExpenses((prev) => prev.filter(e => e.id !== id));
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'contractor_expense_deleted',
          details: `Contractor expense deleted for business ${business.id}`,
          metadata: { business_id: business.id, id }
        });
      }
    }
  };

  // CRUD handlers for supply expenses
  const handleCreateSupplyExpense = async (expense: any) => {
    if (!business) return;
    const res = await createSupplyExpense({ ...expense, business_id: business.id });
    const data = res && 'data' in res ? res.data : null;
    const error = res && typeof res === 'object' && 'error' in res ? (res as any).error : null;
    if (!error && data) {
      setSupplyExpenses((prev) => Array.isArray(data) ? [...prev, ...data] : [...prev, data]);
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'supply_expense_created',
          details: expense,
          metadata: { business_id: business.id }
        });
      }
    }
  };

  const handleUpdateSupplyExpense = async (id: string, updates: any) => {
    if (!business) return;
    const res = await updateSupplyExpense(id, updates);
    const error = res && typeof res === 'object' && 'error' in res ? (res as any).error : null;
    if (!error) {
      setSupplyExpenses((prev) => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'supply_expense_updated',
          details: `Supply expense updated for business ${business.id}`,
          metadata: { business_id: business.id, update: { id, ...updates } }
        });
      }
    }
  };

  const handleDeleteSupplyExpense = async (id: string) => {
    if (!business) return;
    const res = await deleteSupplyExpense(id);
    const error = res && typeof res === 'object' && 'error' in res ? (res as any).error : null;
    if (!error) {
      setSupplyExpenses((prev) => prev.filter(e => e.id !== id));
      if (user?.id) {
        await createChangelogEntry({
          actor_id: user.id,
          target_user_id: user.id,
          action: 'supply_expense_deleted',
          details: `Supply expense deleted for business ${business.id}`,
          metadata: { business_id: business.id, id }
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['DM_Serif_Display'] text-4xl text-gray-900">Qualified Expenses</h1>
            <p className="mt-2 text-lg text-gray-500">
              Review and manage your qualified research expenses
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-36 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg font-medium h-12"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/client/qualified-activities')}
                icon={<ArrowLeftIcon className="h-5 w-5" />}
              >
                Previous Step
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/client/finalize-calculations')}
                icon={<ArrowRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showTotals && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Wages</p>
                  <p className="text-xl font-bold text-gray-900">${totals.totalWages.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Applied</p>
                <p className="text-lg font-semibold text-blue-600">${totals.totalAppliedWages.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Contractors</p>
                  <p className="text-xl font-bold text-gray-900">${totals.totalContractors.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Applied</p>
                <p className="text-lg font-semibold text-purple-600">${totals.totalAppliedContractors.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CubeIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Supplies</p>
                  <p className="text-xl font-bold text-gray-900">${totals.totalSupplies.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Applied</p>
                <p className="text-lg font-semibold text-green-600">${totals.totalAppliedSupplies.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add filters section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="block rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Roles</option>
            {employeeRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTotals(!showTotals)}
            icon={<ChartBarIcon className="h-5 w-5" />}
          >
            {showTotals ? 'Hide Totals' : 'Show Totals'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="relative"
          >
            <ArrowPathIcon className={cn(
              "h-5 w-5 mr-2",
              isRefreshing && "animate-spin"
            )} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setSortConfig(null);
            }}
            icon={<FunnelIcon className="h-5 w-5" />}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <Card className="p-0">
        <div className="border-b border-gray-200">
          <div className="mt-8">
            <div className="sm:hidden">
              <select
                id="tabs"
                name="tabs"
                className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedTab}
                onChange={(e) => setSelectedTab(e.target.value as ExpenseTab)}
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block">
              <nav className="flex space-x-4" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={cn(
                        selectedTab === tab.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700',
                        'px-3 py-2 font-medium text-sm rounded-md flex items-center space-x-2'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        <div className="p-6">
          {selectedTab === 'wages' && (
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <form onSubmit={handleAddEmployee} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={newEmployee.name}
                          onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                          placeholder="Employee Name"
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="w-48">
                        <select
                          value={newEmployee.role}
                          onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value as EmployeeRole })}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10"
                          disabled={newEmployee.isBusinessOwner}
                        >
                          {employeeRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-48">
                        <Input
                          type="text"
                          value={newEmployee.annualWage ? `$${formatCurrencyInput(newEmployee.annualWage)}` : ''}
                          onChange={e => setNewEmployee({ ...newEmployee, annualWage: parseCurrencyInput(e.target.value) })}
                          placeholder="Annual Wage"
                          className="h-10"
                          required
                        />
                      </div>
                      <label className="flex items-center space-x-2 min-h-[2.5rem] px-3">
                        <input
                          type="checkbox"
                          checked={newEmployee.isBusinessOwner}
                          onChange={e => {
                            const isBusinessOwner = e.target.checked;
                            setNewEmployee({
                              ...newEmployee,
                              isBusinessOwner,
                              role: isBusinessOwner ? EmployeeRole.RESEARCH_LEADER : newEmployee.role
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Business Owner</span>
                      </label>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a new employee.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('name')}>
                          <div className="flex items-center space-x-1">
                            <UsersIcon className="h-4 w-4 text-gray-400" />
                            <span>Name</span>
                            {sortConfig?.key === 'name' && (
                              sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('role')}>
                          <div className="flex items-center space-x-1">
                            <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                            <span>Role</span>
                            {sortConfig?.key === 'role' && (
                              sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('annualWage')}>
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                            <span>Annual Wage</span>
                            {sortConfig?.key === 'annualWage' && (
                              sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('applied')}>
                          <div className="flex items-center space-x-1">
                            <ChartBarIcon className="h-4 w-4 text-gray-400" />
                            <span>Applied</span>
                            {sortConfig?.key === 'applied' && (
                              sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEmployees.map(employee => {
                        // Initialize yearlyActivities for the selected year if it doesn't exist
                        if (!employee.yearlyActivities[selectedYear]) {
                          employee.yearlyActivities[selectedYear] = {};
                        }

                        const isEmployeeExpanded = expandedEmployees[employee.id] || false;
                        
                        // Calculate total allocation percentage and amount
                        const totalAllocationPercent = calculateEmployeeAllocation(employee, selectedYear);
                        const totalAllocationAmount = (employee.annualWage * (totalAllocationPercent / 100));

                        return (
                          <React.Fragment key={employee.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{employee.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {employee.role}
                                  {employee.isBusinessOwner && <span className="ml-1 text-xs text-blue-600">(Owner)</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">${employee.annualWage?.toLocaleString() ?? '0'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  <span className="font-medium text-blue-600">${totalAllocationAmount?.toLocaleString() ?? '0'}</span>
                                  <span className="text-gray-500">/{totalAllocationPercent}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onClick={() => toggleEmployeeExpansion(employee.id)} className="text-blue-600 hover:text-blue-900">
                                  {isEmployeeExpanded ? <ChevronUpIcon className="h-5 w-5 inline" /> : <ChevronDownIcon className="h-5 w-5 inline" />}
                                </button>
                                <button onClick={() => handleDeleteEmployee(employee.id)} className="text-red-600 hover:text-red-900">
                                  <TrashIcon className="h-5 w-5 inline" />
                                </button>
                              </td>
                            </tr>
                            {isEmployeeExpanded && (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                  <div className="space-y-4">
                                    {Object.entries(employee.yearlyActivities[selectedYear]).map(([activityId, activity]) => {
                                      if (!activity?.isSelected) return null;
                                      const isActivityExpanded = expandedActivities[`${employee.id}-${activityId}`] || false;
                                      const activityAmount = (employee.annualWage * ((activity?.percentage || 0) / 100));
                                      return (
                                        <div key={`${employee.id}-${activityId}`} className="bg-white rounded-lg shadow p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                                              <h4 className="font-semibold text-blue-800">{activityNameMap[activityId] || activityId}</h4>
                                            </div>
                                            <div className="text-sm">
                                              <span className="font-medium text-blue-600">${activityAmount.toLocaleString()}</span>
                                              <span className="text-gray-500">/{activity?.percentage || 0}%</span>
                                            </div>
                                          </div>
                                          <div className="mb-3">
                                            <input
                                              type="range"
                                              min="0"
                                              max="100"
                                              value={activity?.percentage || 0}
                                              onChange={e => handleUpdateActivityPercentage(employee.id, selectedYear, activityId, parseFloat(e.target.value))}
                                              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                                            />
                                          </div>
                                          <div className="pl-6 space-y-3 mt-4">
                                            {Object.entries(activity?.subcomponents || {}).map(([subId, sub]) => {
                                              if (!sub?.isSelected) return null;
                                              const subcomponentAmount = (employee.annualWage * ((sub?.percentage || 0) / 100));
                                              
                                              return (
                                                <div key={subId} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                                                  <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                      {employee.role === EmployeeRole.RESEARCH_LEADER && <UsersIcon className="h-5 w-5 text-purple-600" />}
                                                      {employee.role === EmployeeRole.CLINICIAN && <BriefcaseIcon className="h-5 w-5 text-blue-600" />}
                                                      {employee.role === EmployeeRole.MIDLEVEL && <CubeIcon className="h-5 w-5 text-green-600" />}
                                                      {employee.role === EmployeeRole.CLINICAL_ASSISTANT && <UsersIcon className="h-5 w-5 text-gray-600" />}
                                                    </div>
                                                    <div>
                                                      <div className="font-medium text-gray-900">{subcomponentNameMap[subId] || subId}</div>
                                                      {sub?.roleDescription && (
                                                        <div className="text-sm text-gray-500">{sub.roleDescription}</div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center space-x-4">
                                                    <div className="text-sm">
                                                      <span className="font-medium text-blue-600">${subcomponentAmount.toLocaleString()}</span>
                                                      <span className="text-gray-500">/{sub?.percentage || 0}%</span>
                                                    </div>
                                                    <input
                                                      type="range"
                                                      min="0"
                                                      max="100"
                                                      value={sub?.percentage || 0}
                                                      onChange={e => handleUpdateSubcomponentPercentage(employee.id, selectedYear, activityId, subId, parseFloat(e.target.value))}
                                                      className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'contractors' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="relative flex-1 max-w-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="Search contractors..."
                    value={contractorSearchTerm}
                    onChange={(e) => setContractorSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => {
                    setEditingContractor(undefined);
                    setShowContractorModal(true);
                  }}
                  className="ml-4"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Contractor
                </Button>
              </div>
              <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <SortableHeader<ContractorExpense>
                            label="Contractor"
                            sortKey="contractorName"
                            currentSort={contractorSortConfig}
                            onSort={handleContractorSort}
                          />
                          <SortableHeader<ContractorExpense>
                            label="Role"
                            sortKey="role"
                            currentSort={contractorSortConfig}
                            onSort={handleContractorSort}
                          />
                          <SortableHeader<ContractorExpense>
                            label="Amount"
                            sortKey="amount"
                            currentSort={contractorSortConfig}
                            onSort={handleContractorSort}
                          />
                          <SortableHeader<ContractorExpense>
                            label="Research %"
                            sortKey="researchPercentage"
                            currentSort={contractorSortConfig}
                            onSort={handleContractorSort}
                          />
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredContractorExpenses.map(expense => {
                          const appliedAmount = expense.amount * (expense.researchPercentage / 100);
                          return (
                            <tr key={expense.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                                <div className="flex items-center">
                                  <div className="ml-4">
                                    <div className="font-medium text-gray-900">{expense.contractorName}</div>
                                    <div className="text-sm text-gray-500">{subcomponentNameMap[expense.subcomponentId] || expense.subcomponentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{expense.role}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatCurrency(expense.amount)}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatPercentage(expense.researchPercentage)}</td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                <button
                                  onClick={() => {
                                    setEditingContractor(expense);
                                    setShowContractorModal(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteContractorExpense(expense.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <Modal isOpen={showContractorModal} onClose={() => setShowContractorModal(false)} title={editingContractor ? 'Edit Contractor' : 'Add Contractor'}>
                <ContractorExpenseForm expense={editingContractor} onClose={() => { setShowContractorModal(false); setEditingContractor(undefined); }} onSubmit={editingContractor ? (updates) => handleUpdateContractorExpense(editingContractor.id, updates) : handleCreateContractorExpense} />
              </Modal>
            </div>
          )}

          {selectedTab === 'supplies' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="relative flex-1 max-w-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="Search supplies..."
                    value={supplySearchTerm}
                    onChange={(e) => setSupplySearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => {
                    setEditingSupply(undefined);
                    setShowSupplyModal(true);
                  }}
                  className="ml-4"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Supply
                </Button>
              </div>
              <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <SortableHeader<SupplyExpense>
                            label="Supplier"
                            sortKey="supplierName"
                            currentSort={supplySortConfig}
                            onSort={handleSupplySort}
                          />
                          <SortableHeader<SupplyExpense>
                            label="Vendor"
                            sortKey="vendor"
                            currentSort={supplySortConfig}
                            onSort={handleSupplySort}
                          />
                          <SortableHeader<SupplyExpense>
                            label="Category"
                            sortKey="category"
                            currentSort={supplySortConfig}
                            onSort={handleSupplySort}
                          />
                          <SortableHeader<SupplyExpense>
                            label="Amount"
                            sortKey="amount"
                            currentSort={supplySortConfig}
                            onSort={handleSupplySort}
                          />
                          <SortableHeader<SupplyExpense>
                            label="Research %"
                            sortKey="researchPercentage"
                            currentSort={supplySortConfig}
                            onSort={handleSupplySort}
                          />
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSupplyExpenses.map(expense => {
                          const appliedAmount = expense.amount * (expense.researchPercentage / 100);
                          return (
                            <tr key={expense.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                                <div className="flex items-center">
                                  <div className="ml-4">
                                    <div className="font-medium text-gray-900">{expense.supplierName}</div>
                                    <div className="text-sm text-gray-500">{subcomponentNameMap[expense.subcomponentId] || expense.subcomponentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{expense.vendor}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{expense.category}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatCurrency(expense.amount)}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatPercentage(expense.researchPercentage)}</td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                <button
                                  onClick={() => {
                                    setEditingSupply(expense);
                                    setShowSupplyModal(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSupplyExpense(expense.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <Modal isOpen={showSupplyModal} onClose={() => setShowSupplyModal(false)} title={editingSupply ? 'Edit Supply' : 'Add Supply'}>
                <SupplyExpenseForm 
                  expense={editingSupply} 
                  onClose={() => { setShowSupplyModal(false); setEditingSupply(undefined); }}
                  onSubmit={editingSupply ? (updates) => handleUpdateSupplyExpense(editingSupply.id, updates) : handleCreateSupplyExpense}
                  subcomponents={allSubcomponents}
                />
              </Modal>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default QualifiedExpenses; 