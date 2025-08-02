import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Download, Printer, Users, DollarSign, Package, 
  BarChart3, PieChart, Building2, Calendar, TrendingUp, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

interface AllocationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessData: any;
  selectedYear: any;
  calculations: any;
}

interface EmployeeData {
  id: string;
  name: string;
  total_qre: number;
  applied_percentage: number;
  roles: string[];
  roleIds: string[];
  activities: Array<{
    name: string;
    applied_percentage: number;
    color: string;
    dollar_amount: number;
  }>;
  subcomponents: Array<{
    name: string;
    applied_percentage: number;
    color: string;
    dollar_amount: number;
  }>;
}

interface ContractorData {
  id: string;
  name: string;
  cost_amount: number;
  applied_percent: number;
  subcomponents: Array<{
    name: string;
    applied_percentage: number;
    color: string;
  }>;
}

interface SupplyData {
  id: string;
  name: string;
  cost: number;
  applied_percentage: number;
  subcomponents: Array<{
    name: string;
    applied_percentage: number;
    color: string;
  }>;
}

// Apply 80% threshold rule (matches calculations logic)
const applyEightyPercentThreshold = (appliedPercentage: number): number => {
  return appliedPercentage >= 80 ? 100 : appliedPercentage;
};

// Color palette for subcomponents (matching Filing Guide colors)
const SUBCOMPONENT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const AllocationReportModal: React.FC<AllocationReportModalProps> = ({
  isOpen,
  onClose,
  businessData,
  selectedYear,
  calculations
}) => {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [contractors, setContractors] = useState<ContractorData[]>([]);
  const [supplies, setSupplies] = useState<SupplyData[]>([]);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [subcomponentColors, setSubcomponentColors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen && selectedYear?.id) {
      console.log('🚀 AllocationReportModal - Opening with:', {
        businessData: businessData?.name || businessData?.id,
        selectedYear: selectedYear?.year,
        businessYearId: selectedYear?.id
      });
      loadAllocationData();
    }
  }, [isOpen, selectedYear?.id]);

  const loadAllocationData = async () => {
    setLoading(true);
    try {
      // Load business profile
      const { data: business, error: businessError } = await supabase
        .from('rd_businesses')
        .select('*')
        .eq('id', businessData.id)
        .single();

      if (businessError) throw businessError;
      setBusinessProfile(business);

      // Load selected activities for the business year to get activity lookup
      const { data: selectedActivities, error: actError } = await supabase
        .from('rd_selected_activities')
        .select(`
          *,
          rd_research_activities!inner(id, title)
        `)
        .eq('business_year_id', selectedYear.id);

      if (actError) throw actError;

      // Create activity lookup table
      const activityLookup: Record<string, { title: string }> = {};
      selectedActivities?.forEach(activityItem => {
        activityLookup[activityItem.activity_id] = {
          title: activityItem.rd_research_activities.title
        };
      });

      // Load selected subcomponents to get the activity relationships
      const { data: selectedSubcomponents, error: selectedSubError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          subcomponent_id,
          research_activity_id,
          step_id
        `)
        .eq('business_year_id', selectedYear.id);

      if (selectedSubError) throw selectedSubError;

      // Create subcomponent to activity mapping
      const subcomponentToActivity: Record<string, { activity_id: string; step_id: string }> = {};
      selectedSubcomponents?.forEach(item => {
        subcomponentToActivity[item.subcomponent_id] = {
          activity_id: item.research_activity_id,
          step_id: item.step_id
        };
      });

      // ✅ ALLOCATION MODAL SYNC FIX: Load employees even without subcomponent data
      // ISSUE: Previous query only showed employees with rd_employee_subcomponents records
      // SOLUTION: First get all employees with year data, then get their subcomponent data separately
      
      // Load all employees who have year data for this business year
      const { data: employeeYearData, error: empYearError } = await supabase
        .from('rd_employee_year_data')
        .select(`
          employee_id,
          rd_employees!inner(id, first_name, last_name, annual_wage, role_id, rd_roles(id, name))
        `)
        .eq('business_year_id', selectedYear.id);

      if (empYearError) throw empYearError;

      // Extract unique employees
      const allEmployees = employeeYearData?.map(item => item.rd_employees).filter(Boolean) || [];
      console.log('🔍 Found employees with year data:', allEmployees.length);

      // Now load subcomponent data for these employees (if any exists)
      const { data: employeeData, error: empError } = await supabase
        .from('rd_employee_subcomponents')
        .select(`
          *,
          rd_employees!inner(id, first_name, last_name, annual_wage, role_id, rd_roles(id, name)),
          rd_research_subcomponents!inner(id, name)
        `)
        .eq('business_year_id', selectedYear.id)
        .eq('is_included', true)
        .in('employee_id', allEmployees.map(emp => emp.id));

      if (empError) throw empError;

      // ✅ SYNC FIX: Process employee data including those without subcomponent allocations
      // Merge all employees with their subcomponent data (if any)
      const processedEmployees = processEmployeeData(
        employeeData || [], 
        activityLookup, 
        subcomponentToActivity,
        allEmployees // Pass all employees to ensure they're included even without subcomponents
      );
      console.log('🔍 Processed employees (including those without subcomponents):', processedEmployees.length);
      setEmployees(processedEmployees);

      // Load contractors
      const { data: contractorData, error: contError } = await supabase
        .from('rd_contractor_year_data')
        .select('*')
        .eq('business_year_id', selectedYear.id);

      if (contError) throw contError;

      // Process contractor data
      const processedContractors = processContractorData(contractorData || []);
      setContractors(processedContractors);

      // Load supplies
      const { data: supplyData, error: supError } = await supabase
        .from('rd_supply_year_data')
        .select('*')
        .eq('business_year_id', selectedYear.id);

      if (supError) throw supError;

      // Process supply data
      const processedSupplies = processSupplyData(supplyData || []);
      setSupplies(processedSupplies);

    } catch (error) {
      console.error('Error loading allocation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEmployeeData = (
    data: any[], 
    activityLookup: Record<string, { title: string }>,
    subcomponentToActivity: Record<string, { activity_id: string; step_id: string }>,
    allEmployees?: any[] // ✅ SYNC FIX: Optional parameter for all employees even without subcomponents
  ): EmployeeData[] => {
    const employeeMap = new Map<string, EmployeeData>();
    
    console.log('🔍 AllocationReport - Processing employee data:', data.length, 'records');
    console.log('🔍 AllocationReport - Activity lookup:', activityLookup);
    console.log('🔍 AllocationReport - Subcomponent to activity mapping:', subcomponentToActivity);
    
    // Process subcomponent data
    data.forEach(item => {
      const empId = item.rd_employees.id;
      const empName = `${item.rd_employees.first_name} ${item.rd_employees.last_name}`;
      const annualWage = item.rd_employees.annual_wage || 0;
      
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          id: empId,
          name: empName,
          total_qre: annualWage,
          applied_percentage: 0,
          roles: item.rd_employees.rd_roles ? [item.rd_employees.rd_roles.name] : [],
          roleIds: item.rd_employees.rd_roles ? [item.rd_employees.rd_roles.id] : [],
          activities: [],
          subcomponents: []
        });
        console.log('👤 AllocationReport - Added employee:', empName, 'with wage:', annualWage);
      }
      
      const employee = employeeMap.get(empId)!;
      const subcompName = item.rd_research_subcomponents.name;
      const appliedPercentage = item.applied_percentage || 0;
      const dollarAmount = (annualWage * appliedPercentage) / 100;
      
      console.log('📋 AllocationReport - Processing subcomponent:', subcompName, 'applied:', appliedPercentage + '%', 'amount:', dollarAmount);
      
      // Assign color to subcomponent
      if (!subcomponentColors[subcompName]) {
        const colorIndex = Object.keys(subcomponentColors).length % SUBCOMPONENT_COLORS.length;
        subcomponentColors[subcompName] = SUBCOMPONENT_COLORS[colorIndex];
      }
      
      employee.subcomponents.push({
        name: subcompName,
        applied_percentage: appliedPercentage,
        color: subcomponentColors[subcompName],
        dollar_amount: dollarAmount
      });
      
      employee.applied_percentage += appliedPercentage;
    });

    // Group subcomponents by employee and activity using subcomponent mapping
    const employeeActivityTotals: Record<string, Record<string, { total_applied: number; activity_name: string; activity_id: string }>> = {};
    
    console.log('🔄 AllocationReport - Starting activity grouping...');
    
    data.forEach(item => {
      const empId = item.rd_employees.id;
      const subcomponentId = item.subcomponent_id;
      const appliedPercentage = item.applied_percentage || 0;
      
      // Get activity info from subcomponent mapping
      const activityMapping = subcomponentToActivity[subcomponentId];
      if (!activityMapping) {
        console.warn(`⚠️ No activity mapping found for subcomponent ${subcomponentId}`);
        return;
      }
      
      const activityId = activityMapping.activity_id;
      const activityName = activityLookup[activityId]?.title || 'Unknown Activity';
      
      console.log('🔗 AllocationReport - Mapping subcomponent:', subcomponentId, 'to activity:', activityName, 'applied:', appliedPercentage + '%');
      
      if (!employeeActivityTotals[empId]) {
        employeeActivityTotals[empId] = {};
      }
      
      if (!employeeActivityTotals[empId][activityId]) {
        employeeActivityTotals[empId][activityId] = {
          total_applied: 0,
          activity_name: activityName,
          activity_id: activityId
        };
      }
      
      employeeActivityTotals[empId][activityId].total_applied += appliedPercentage;
    });
    
    console.log('📊 AllocationReport - Employee activity totals:', employeeActivityTotals);
    
    // Now add activities to each employee based on their actual allocations
    employeeMap.forEach(employee => {
      const employeeActivities = employeeActivityTotals[employee.id] || {};
      
      console.log('🎯 AllocationReport - Adding activities for employee:', employee.name, 'activities:', Object.keys(employeeActivities));
      
      Object.values(employeeActivities).forEach(activityTotal => {
        if (activityTotal.total_applied > 0) {
          // Assign color to activity
          if (!subcomponentColors[activityTotal.activity_name]) {
            const colorIndex = Object.keys(subcomponentColors).length % SUBCOMPONENT_COLORS.length;
            subcomponentColors[activityTotal.activity_name] = SUBCOMPONENT_COLORS[colorIndex];
          }
          
          const dollarAmount = (employee.total_qre * activityTotal.total_applied) / 100;
          
          console.log('✨ AllocationReport - Adding activity:', activityTotal.activity_name, 'applied:', activityTotal.total_applied + '%', 'amount:', dollarAmount);
          
          employee.activities.push({
            name: activityTotal.activity_name,
            applied_percentage: activityTotal.total_applied,
            color: subcomponentColors[activityTotal.activity_name],
            dollar_amount: dollarAmount
          });
        }
      });
      
      console.log('✅ AllocationReport - Final employee data for', employee.name + ':', {
        activities: employee.activities.length,
        subcomponents: employee.subcomponents.length,
        total_applied: employee.applied_percentage
      });
    });
    
    // ✅ SYNC FIX: Include all employees even if they have no subcomponent allocations
    if (allEmployees) {
      allEmployees.forEach(emp => {
        if (!employeeMap.has(emp.id)) {
          console.log('✅ SYNC FIX - Adding employee without subcomponents:', emp.first_name, emp.last_name);
          employeeMap.set(emp.id, {
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            total_qre: emp.annual_wage || 0,
            applied_percentage: 0,
            roles: emp.rd_roles ? [emp.rd_roles.name] : [],
            roleIds: emp.rd_roles ? [emp.rd_roles.id] : [],
            activities: [],
            subcomponents: []
          });
        }
      });
    }
    
    const result = Array.from(employeeMap.values());
    console.log('🎉 AllocationReport - Final processed employees (including those without subcomponents):', result.length);
    result.forEach(emp => {
      console.log(`📈 ${emp.name}: ${emp.activities.length} activities, ${emp.subcomponents.length} subcomponents`);
    });
    
    return result;
  };

  const processContractorData = (data: any[]): ContractorData[] => {
    return data.map(item => ({
      id: item.id,
      name: item.name,
      cost_amount: item.cost_amount || 0,
      applied_percent: item.applied_percent || 0,
      subcomponents: [] // Will be populated from activity_link data
    }));
  };

  const processSupplyData = (data: any[]): SupplyData[] => {
    return data.map(item => ({
      id: item.id,
      name: item.name,
      cost: item.cost || 0,
      applied_percentage: item.applied_percentage || 0,
      subcomponents: [] // Will be populated from activity breakdown
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getTotalEmployeeQRE = () => {
    return employees.reduce((sum, emp) => {
      const qreAppliedPercentage = applyEightyPercentThreshold(emp.applied_percentage);
      return sum + (emp.total_qre * (qreAppliedPercentage / 100));
    }, 0);
  };

  const getTotalContractorQRE = () => {
    return contractors.reduce((sum, cont) => sum + (cont.cost_amount * (cont.applied_percent / 100)), 0);
  };

  const getTotalSupplyQRE = () => {
    return supplies.reduce((sum, sup) => sum + (sup.cost * (sup.applied_percentage / 100)), 0);
  };

  const getTotalQRE = () => {
    return getTotalEmployeeQRE() + getTotalContractorQRE() + getTotalSupplyQRE();
  };

  const generateAllocationHTML = () => {
    const totalQRE = getTotalQRE();
    const empQRE = getTotalEmployeeQRE();
    const contQRE = getTotalContractorQRE();
    const supQRE = getTotalSupplyQRE();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Allocation Report - ${businessProfile?.name || 'Business'} - ${selectedYear?.year || new Date().getFullYear()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.4; 
            color: #333; 
            font-size: 14px;
        }
        .container { 
            max-width: 8.5in; 
            margin: 0 auto; 
            padding: 0.5in; 
        }
        .header { 
            background: linear-gradient(135deg, #10b981, #047857); 
            color: white; 
            padding: 20px; 
            text-align: center; 
            margin-bottom: 20px;
            border-radius: 8px;
        }
        .logo { display: inline-block; margin-bottom: 10px; }
        .title { font-size: 1.8rem; font-weight: 700; margin-bottom: 8px; }
        .subtitle { font-size: 1rem; opacity: 0.9; }
        .report-meta { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 6px; 
            margin-bottom: 20px; 
            page-break-inside: avoid;
        }
        .meta-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
        }
        .meta-item { text-align: center; }
        .meta-label { 
            font-size: 0.75rem; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }
        .meta-value { font-size: 1rem; font-weight: 600; color: #1f2937; }
        .section { 
            margin-bottom: 25px; 
            page-break-inside: avoid;
        }
        .section-title { 
            font-size: 1.3rem; 
            font-weight: 600; 
            margin-bottom: 15px; 
            color: #1f2937; 
            border-bottom: 2px solid #10b981; 
            padding-bottom: 8px; 
        }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            margin-bottom: 20px; 
        }
        .summary-card { 
            background: white; 
            border: 1px solid #e5e7eb; 
            border-radius: 6px; 
            padding: 15px; 
            text-align: center; 
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); 
        }
        .summary-value { font-size: 1.5rem; font-weight: 700; color: #10b981; }
        .summary-label { 
            font-size: 0.75rem; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }
        .allocation-section { 
            background: white; 
            border: 1px solid #e5e7eb; 
            border-radius: 6px; 
            padding: 15px; 
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        .allocation-header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 12px; 
        }
        .allocation-icon { margin-right: 8px; }
        .allocation-title { font-size: 1.1rem; font-weight: 600; }
        .employee-item {
            border-bottom: 1px solid #f3f4f6;
            padding: 15px 0;
            page-break-inside: avoid;
        }
        .employee-item:last-child { border-bottom: none; }
        .employee-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        .employee-info { flex: 1; }
        .employee-name { font-size: 1.1rem; font-weight: 600; margin-bottom: 5px; }
        .roles-container { margin-bottom: 8px; }
        .role-tag {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            margin-right: 4px;
            margin-bottom: 2px;
        }
        .employee-details {
            font-size: 0.85rem;
            color: #6b7280;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .applied-amount {
            text-align: right;
            margin-left: 15px;
        }
        .applied-value { 
            font-size: 1.3rem; 
            font-weight: 700; 
            color: #10b981; 
        }
        .applied-label { 
            font-size: 0.8rem; 
            color: #6b7280; 
        }
        .breakdown-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: #4b5563;
            margin: 12px 0 8px 0;
        }
        .progress-bar { 
            width: 100%; 
            height: 24px; 
            background: #f3f4f6; 
            border-radius: 12px; 
            overflow: hidden; 
            margin-bottom: 12px;
        }
        .progress-segment { height: 100%; display: inline-block; }
        .legend-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px;
            background: #f9fafb;
            border-radius: 4px;
            font-size: 0.85rem;
        }
        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            flex-shrink: 0;
        }
        .legend-info { flex: 1; font-weight: 500; }
        .legend-amounts { text-align: right; }
        .legend-amount { font-weight: 600; }
        .legend-percent { font-size: 0.75rem; color: #6b7280; }
        .no-data { text-align: center; color: #6b7280; font-style: italic; padding: 30px; }
        
        @media print {
            @page {
                size: 8.5in 11in;
                margin: 0.5in;
            }
            body { 
                font-size: 11px; 
                line-height: 1.3;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .container { 
                max-width: none; 
                margin: 0; 
                padding: 0; 
                width: 100%;
            }
            .header { 
                background: #10b981 !important; 
                -webkit-print-color-adjust: exact; 
                color-adjust: exact; 
                color: white !important;
                page-break-inside: avoid;
            }
            .section {
                page-break-inside: avoid;
                margin-bottom: 20px;
            }
            .employee-item {
                page-break-inside: avoid;
                margin-bottom: 15px;
            }
            .allocation-section {
                page-break-inside: avoid;
            }
            .progress-segment {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .role-tag {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <svg width="200" height="40" viewBox="0 0 200 40" fill="none">
                    <text x="10" y="25" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">Direct Research</text>
                    <text x="10" y="35" font-family="Arial, sans-serif" font-size="10" fill="white" opacity="0.8">ADVISORS</text>
                </svg>
            </div>
            <h1 class="title">Allocation Report</h1>
            <p class="subtitle">QRE Breakdown & Calculation Specifics</p>
        </div>

        <!-- Report Meta -->
        <div class="report-meta">
            <div class="meta-grid">
                <div class="meta-item">
                    <div class="meta-label">Business Name</div>
                    <div class="meta-value">${businessProfile?.name || 'N/A'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Tax Year</div>
                    <div class="meta-value">${selectedYear?.year || new Date().getFullYear()}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Total QRE</div>
                    <div class="meta-value">${formatCurrency(totalQRE)}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Report Date</div>
                    <div class="meta-value">${new Date().toLocaleDateString()}</div>
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">${employees.length}</div>
                <div class="summary-label">Employees</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${contractors.length}</div>
                <div class="summary-label">Contractors</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${supplies.length}</div>
                <div class="summary-label">Supplies</div>
            </div>
        </div>

        <!-- Employee Allocations -->
        <div class="section">
            <h2 class="section-title">👥 Employee Allocations</h2>
            <div class="allocation-section">
                ${employees.length > 0 ? employees.map(emp => `
                    <div class="employee-item">
                        <div class="employee-header">
                            <div class="employee-info">
                                <div class="employee-name">${emp.name}</div>
                                ${emp.roles && emp.roles.length > 0 ? `
                                    <div class="roles-container">
                                        ${emp.roles.map(role => `<span class="role-tag">${role}</span>`).join('')}
                                    </div>
                                ` : ''}
                                <div class="employee-details">
                                    <div><strong>Total Annual Wage:</strong> ${formatCurrency(emp.total_qre)}</div>
                                    <div><strong>Total Applied:</strong> ${formatPercentage(emp.applied_percentage)}</div>
                                </div>
                            </div>
                            <div class="applied-amount">
                                <div class="applied-value">${formatCurrency(emp.total_qre * (applyEightyPercentThreshold(emp.applied_percentage) / 100))}</div>
                                <div class="applied-label">Applied Amount</div>
                            </div>
                        </div>
                        ${emp.activities && emp.activities.length > 0 ? `
                            <div class="breakdown-title">Research Activity Participation:</div>
                            <div class="progress-bar">
                                ${emp.activities.map(activity => 
                                    `<div class="progress-segment" style="width: ${(activity.applied_percentage / emp.applied_percentage) * 100}%; background-color: ${activity.color};" title="${activity.name}: ${formatPercentage(activity.applied_percentage)} (${formatCurrency(activity.dollar_amount)})"></div>`
                                ).join('')}
                            </div>
                            <div class="legend-grid">
                                ${emp.activities.map(activity => `
                                    <div class="legend-item">
                                        <div style="display: flex; align-items: center;">
                                            <div class="legend-color" style="background-color: ${activity.color};"></div>
                                            <span class="legend-info">${activity.name}</span>
                                        </div>
                                        <div class="legend-amounts">
                                            <div class="legend-amount">${formatCurrency(activity.dollar_amount)}</div>
                                            <div class="legend-percent">${formatPercentage(activity.applied_percentage)}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${emp.subcomponents.length > 0 ? `
                            <div class="breakdown-title">Subcomponent Breakdown:</div>
                            <div class="progress-bar">
                                ${emp.subcomponents.map(sub => 
                                    `<div class="progress-segment" style="width: ${(sub.applied_percentage / emp.applied_percentage) * 100}%; background-color: ${sub.color};" title="${sub.name}: ${formatPercentage(sub.applied_percentage)} (${formatCurrency(sub.dollar_amount)})"></div>`
                                ).join('')}
                            </div>
                            <div class="legend-grid">
                                ${emp.subcomponents.map(sub => `
                                    <div class="legend-item">
                                        <div style="display: flex; align-items: center;">
                                            <div class="legend-color" style="background-color: ${sub.color};"></div>
                                            <span class="legend-info">${sub.name}</span>
                                        </div>
                                        <div class="legend-amounts">
                                            <div class="legend-amount">${formatCurrency(sub.dollar_amount)}</div>
                                            <div class="legend-percent">${formatPercentage(sub.applied_percentage)}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('') : '<div class="no-data">No employee data available</div>'}
            </div>
        </div>

        <!-- Contractor Allocations -->
        <div class="section">
            <h2 class="section-title">💼 Contractor Allocations</h2>
            <div class="allocation-section">
                ${contractors.length > 0 ? contractors.map(cont => `
                    <div class="employee-item">
                        <div class="employee-header">
                            <div class="employee-info">
                                <div class="employee-name">${cont.name}</div>
                                <div class="employee-details">
                                    <div><strong>Total Cost:</strong> ${formatCurrency(cont.cost_amount)}</div>
                                    <div><strong>Applied Percentage:</strong> ${formatPercentage(cont.applied_percent)}</div>
                                </div>
                            </div>
                            <div class="applied-amount">
                                <div class="applied-value">${formatCurrency(cont.cost_amount * (cont.applied_percent / 100))}</div>
                                <div class="applied-label">Applied Amount</div>
                            </div>
                        </div>
                    </div>
                `).join('') : '<div class="no-data">No contractor data available</div>'}
            </div>
        </div>

        <!-- Supply Allocations -->
        <div class="section">
            <h2 class="section-title">📦 Supply Allocations</h2>
            <div class="allocation-section">
                ${supplies.length > 0 ? supplies.map(sup => `
                    <div class="employee-item">
                        <div class="employee-header">
                            <div class="employee-info">
                                <div class="employee-name">${sup.name}</div>
                                <div class="employee-details">
                                    <div><strong>Total Cost:</strong> ${formatCurrency(sup.cost)}</div>
                                    <div><strong>Applied Percentage:</strong> ${formatPercentage(sup.applied_percentage)}</div>
                                </div>
                            </div>
                            <div class="applied-amount">
                                <div class="applied-value">${formatCurrency(sup.cost * (sup.applied_percentage / 100))}</div>
                                <div class="applied-label">Applied Amount</div>
                            </div>
                        </div>
                    </div>
                `).join('') : '<div class="no-data">No supply data available</div>'}
            </div>
        </div>

        <!-- Allocation Summary -->
        <div class="section">
            <h2 class="section-title">📊 Allocation Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-value">${formatCurrency(empQRE)}</div>
                    <div class="summary-label">Employee QRE</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${formatCurrency(contQRE)}</div>
                    <div class="summary-label">Contractor QRE</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${formatCurrency(supQRE)}</div>
                    <div class="summary-label">Supply QRE</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const generatePuppeteerHTML = () => {
    const totalQRE = getTotalQRE();
    const empQRE = getTotalEmployeeQRE();
    const contQRE = getTotalContractorQRE();
    const supQRE = getTotalSupplyQRE();

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Allocation Report - ${businessProfile?.name || 'Business'} - ${selectedYear?.year || new Date().getFullYear()}</title>
        
        <!-- Google Fonts - Plus Jakarta Sans -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet">
        
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          html {
            font-size: 14px;
            line-height: 1.6;
          }

          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', system-ui, sans-serif;
            font-weight: 400;
            font-size: 11px;
            color: #1f2937;
            background: white;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            line-height: 1.5;
          }

          .pdf-wrapper {
            width: 100%;
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
            min-height: 11in;
            position: relative;
          }

          /* Header Styling */
          .pdf-header {
            background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            color: white;
            padding: 12px 8px;
            margin-bottom: 16px;
            position: relative;
            overflow: hidden;
          }

          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            position: relative;
            z-index: 1;
          }

          .logo-section {
            background: rgba(255, 255, 255, 0.15);
            padding: 8px 12px;
            border-radius: 8px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .logo-img {
            height: 24px;
            width: auto;
            object-fit: contain;
            filter: brightness(0) invert(1);
          }

          .company-name {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 14px;
            font-weight: 700;
            margin: 0;
            color: white;
            letter-spacing: -0.025em;
            line-height: 1.2;
          }

          .document-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 18px;
            font-weight: 800;
            margin: 0;
            color: white;
            letter-spacing: -0.025em;
            line-height: 1.2;
            text-align: right;
          }

          /* Content Area */
          .pdf-content {
            padding: 0 8px;
            min-height: 600px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }

          /* Meta Information */
          .report-meta { 
            background: #f8fafc; 
            padding: 12px; 
            border-radius: 6px; 
            margin-bottom: 16px; 
            page-break-inside: avoid;
          }
          .meta-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 12px; 
          }
          .meta-item { text-align: center; }
          .meta-label { 
            font-size: 9px; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
          }
          .meta-value { font-size: 11px; font-weight: 600; color: #1f2937; }

          /* Section Styling */
          .section { 
            margin-bottom: 20px; 
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 12px; 
            color: #1f2937; 
            border-bottom: 2px solid #10b981; 
            padding-bottom: 6px; 
          }

          /* Summary Cards */
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 12px; 
            margin-bottom: 16px; 
          }
          .summary-card { 
            background: white; 
            border: 1px solid #e5e7eb; 
            border-radius: 6px; 
            padding: 12px; 
            text-align: center; 
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); 
          }
          .summary-value { font-size: 16px; font-weight: 700; color: #10b981; }
          .summary-label { 
            font-size: 9px; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
          }

          /* Allocation Sections */
          .allocation-section { 
            background: white; 
            border: 1px solid #e5e7eb; 
            border-radius: 6px; 
            padding: 12px; 
            margin-bottom: 12px;
            page-break-inside: avoid;
          }
          .allocation-header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 10px; 
          }
          .allocation-icon { margin-right: 6px; }
          .allocation-title { font-size: 14px; font-weight: 600; }

          /* Employee Items */
          .employee-item {
            border-bottom: 1px solid #f3f4f6;
            padding: 12px 0;
            page-break-inside: avoid;
          }
          .employee-item:last-child { border-bottom: none; }
          .employee-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .employee-info { flex: 1; }
          .employee-name { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
          .roles-container { margin-bottom: 6px; }
          .role-tag {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 8px;
            margin-right: 3px;
            margin-bottom: 2px;
          }
          .employee-details {
            font-size: 9px;
            color: #6b7280;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .applied-amount {
            text-align: right;
            margin-left: 12px;
          }
          .applied-value { 
            font-size: 14px; 
            font-weight: 700; 
            color: #10b981; 
          }
          .applied-label { 
            font-size: 8px; 
            color: #6b7280; 
          }

          /* Progress and Legend */
          .breakdown-title {
            font-size: 10px;
            font-weight: 600;
            color: #4b5563;
            margin: 10px 0 6px 0;
          }
          .progress-bar { 
            width: 100%; 
            height: 20px; 
            background: #f3f4f6; 
            border-radius: 10px; 
            overflow: hidden; 
            margin-bottom: 10px;
          }
          .progress-segment { height: 100%; display: inline-block; }
          .legend-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 6px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px;
            background: #f9fafb;
            border-radius: 4px;
            font-size: 9px;
          }
          .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 6px;
            flex-shrink: 0;
          }
          .legend-info { flex: 1; font-weight: 500; }
          .legend-amounts { text-align: right; }
          .legend-amount { font-weight: 600; }
          .legend-percent { font-size: 8px; color: #6b7280; }
          .no-data { text-align: center; color: #6b7280; font-style: italic; padding: 24px; }

          /* Professional Footer */
          .pdf-footer {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-top: 3px solid #e5e7eb;
            padding: 12px 16px;
            margin-top: 24px;
            position: relative;
          }

          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #6b7280;
          }

          /* Print Optimizations */
          @page {
            margin: 0.25in 0.1in 0.4in 0.1in;
            size: Letter;
          }

          @media print {
            body {
              font-size: 10px;
            }
            .pdf-header {
              background: #10b981 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            .progress-segment {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            .role-tag {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="pdf-wrapper">
          <!-- Professional Header -->
          <div class="pdf-header">
            <div class="header-content">
              <div class="header-left">
                <div class="logo-section">
                  <div class="company-logo">
                    <img src="${import.meta.env.VITE_PUBLIC_SITE_URL}/images/Direct Research_horizontal advisors logo.png" alt="Direct Research Logo" class="logo-img">
                  </div>
                  <div class="company-info">
                    <h2 class="company-name">Direct Research</h2>
                  </div>
                </div>
              </div>
              <div class="header-right">
                <h1 class="document-title">Allocation Report</h1>
              </div>
            </div>
          </div>

          <!-- Document Content -->
          <div class="pdf-content">
            ${generateAllocationHTML().match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] || '<!-- Content extraction failed -->'}
          </div>

          <!-- Professional Footer -->
          <div class="pdf-footer">
            <div class="footer-content">
              <div class="footer-left">
                <span>Prepared by Direct Research</span>
              </div>
              <div class="footer-center">
                <span>Confidential & Proprietary</span>
              </div>
              <div class="footer-right">
                <span>Tax Year ${selectedYear?.year || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateAllocationHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const htmlContent = generateAllocationHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allocation-report-${businessProfile?.name?.replace(/\s+/g, '-').toLowerCase() || 'business'}-${selectedYear?.year || new Date().getFullYear()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePDFDownload = async () => {
    setLoading(true);
    try {
      console.log('🔄 Starting Allocation Report PDF generation...');
      
      // Generate PDF using Puppeteer backend
      const cleanedContent = generatePuppeteerHTML();
      
      console.log('📄 Sending content to Puppeteer server...');
      const response = await fetch(`${import.meta.env.VITE_PDF_SERVER_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: cleanedContent,
          filename: `Allocation_Report_${businessProfile?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Business'}_${selectedYear?.year || new Date().getFullYear()}.pdf`
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`PDF generation failed: ${errorData}`);
      }

      console.log('✅ [PUPPETEER API] PDF downloaded successfully');
      
      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Allocation_Report_${businessProfile?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Business'}_${selectedYear?.year || new Date().getFullYear()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log('✅ [PUPPETEER PDF] Allocation Report PDF generated successfully');
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                <svg width="32" height="32" viewBox="0 0 100 40" fill="none">
                  <text x="5" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="currentColor">Direct Research</text>
                  <text x="5" y="32" fontFamily="Arial, sans-serif" fontSize="6" fill="currentColor" opacity="0.8">ADVISORS</text>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Allocation Report</h2>
                <p className="text-emerald-100">QRE Breakdown & Calculation Specifics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-3 py-2 bg-white text-emerald-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                HTML
              </button>
              <button
                onClick={handlePDFDownload}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Generating...' : 'PDF'}
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar TOC */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h3>
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Report Overview', icon: FileText },
                { id: 'employees', label: 'Employee Allocations', icon: Users },
                { id: 'contractors', label: 'Contractor Allocations', icon: Building2 },
                { id: 'supplies', label: 'Supply Allocations', icon: Package },
                { id: 'summary', label: 'Allocation Summary', icon: BarChart3 }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center p-3 text-left rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-emerald-100 text-emerald-700 border-l-4 border-emerald-500' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Quick Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total QRE:</span>
                  <span className="font-medium">{formatCurrency(getTotalQRE())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employees:</span>
                  <span className="font-medium">{employees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contractors:</span>
                  <span className="font-medium">{contractors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplies:</span>
                  <span className="font-medium">{supplies.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading allocation data...</p>
                </div>
              </div>
            ) : showPreview ? (
              <iframe
                srcDoc={generateAllocationHTML()}
                className="w-full h-full border-none"
                title="Allocation Report Preview"
              />
            ) : (
              <div className="p-8">
                {/* Report Overview */}
                <section id="overview" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-emerald-600" />
                    Report Overview
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                      This allocation report provides a detailed breakdown of Qualified Research Expenses (QRE) across all employees, 
                      contractors, and supplies for the {selectedYear?.year || new Date().getFullYear()} tax year.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(getTotalQRE())}</div>
                        <div className="text-sm text-gray-600">Total QRE</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
                        <div className="text-sm text-gray-600">Employees</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{contractors.length}</div>
                        <div className="text-sm text-gray-600">Contractors</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{supplies.length}</div>
                        <div className="text-sm text-gray-600">Supplies</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Employee Allocations */}
                <section id="employees" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Users className="w-6 h-6 mr-3 text-blue-600" />
                    Employee Allocations
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {employees.length > 0 ? (
                      <div className="space-y-6">
                        {employees.map(emp => (
                          <div key={emp.id} className="border-b border-gray-100 pb-8 last:border-b-0 break-inside-avoid">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{emp.name}</h3>
                                {emp.roles && emp.roles.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {emp.roles.map((role, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="text-sm text-gray-600">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="font-medium">Total Annual Wage:</span> {formatCurrency(emp.total_qre)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Total Applied:</span> {formatPercentage(emp.applied_percentage)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-xl font-bold text-blue-600">
                                  {formatCurrency(emp.total_qre * (applyEightyPercentThreshold(emp.applied_percentage) / 100))}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Applied Amount
                                </div>
                              </div>
                            </div>
                            {emp.activities && emp.activities.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Research Activity Participation:</h4>
                                <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden mb-4">
                                  {emp.activities.map((activity, idx) => (
                                    <div
                                      key={idx}
                                      className="h-full inline-block"
                                      style={{
                                        width: `${(activity.applied_percentage / emp.applied_percentage) * 100}%`,
                                        backgroundColor: activity.color
                                      }}
                                      title={`${activity.name}: ${formatPercentage(activity.applied_percentage)} (${formatCurrency(activity.dollar_amount)})`}
                                    />
                                  ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {emp.activities.map((activity, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                                      <div className="flex items-center">
                                        <div 
                                          className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                          style={{ backgroundColor: activity.color }}
                                        />
                                        <span className="font-medium">{activity.name}</span>
                                      </div>
                                      <div className="text-right ml-2">
                                        <div className="font-semibold">{formatCurrency(activity.dollar_amount)}</div>
                                        <div className="text-xs text-gray-600">{formatPercentage(activity.applied_percentage)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {emp.subcomponents.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Subcomponent Breakdown:</h4>
                                <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden mb-4">
                                  {emp.subcomponents.map((sub, idx) => (
                                    <div
                                      key={idx}
                                      className="h-full inline-block"
                                      style={{
                                        width: `${(sub.applied_percentage / emp.applied_percentage) * 100}%`,
                                        backgroundColor: sub.color
                                      }}
                                      title={`${sub.name}: ${formatPercentage(sub.applied_percentage)} (${formatCurrency(sub.dollar_amount)})`}
                                    />
                                  ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {emp.subcomponents.map((sub, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                      <div className="flex items-center">
                                        <div 
                                          className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                          style={{ backgroundColor: sub.color }}
                                        />
                                        <span className="font-medium">{sub.name}</span>
                                      </div>
                                      <div className="text-right ml-2">
                                        <div className="font-semibold">{formatCurrency(sub.dollar_amount)}</div>
                                        <div className="text-xs text-gray-600">{formatPercentage(sub.applied_percentage)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No employee data available
                      </div>
                    )}
                  </div>
                </section>

                {/* Contractor Allocations */}
                <section id="contractors" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Building2 className="w-6 h-6 mr-3 text-orange-600" />
                    Contractor Allocations
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {contractors.length > 0 ? (
                      <div className="space-y-4">
                        {contractors.map(cont => (
                          <div key={cont.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h3 className="font-semibold text-gray-900">{cont.name}</h3>
                              <div className="text-sm text-gray-600">Total Cost: {formatCurrency(cont.cost_amount)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-600">
                                {formatCurrency(cont.cost_amount * (cont.applied_percent / 100))}
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatPercentage(cont.applied_percent)} applied
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No contractor data available
                      </div>
                    )}
                  </div>
                </section>

                {/* Supply Allocations */}
                <section id="supplies" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Package className="w-6 h-6 mr-3 text-purple-600" />
                    Supply Allocations
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {supplies.length > 0 ? (
                      <div className="space-y-4">
                        {supplies.map(sup => (
                          <div key={sup.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h3 className="font-semibold text-gray-900">{sup.name}</h3>
                              <div className="text-sm text-gray-600">Total Cost: {formatCurrency(sup.cost)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-600">
                                {formatCurrency(sup.cost * (sup.applied_percentage / 100))}
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatPercentage(sup.applied_percentage)} applied
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No supply data available
                      </div>
                    )}
                  </div>
                </section>

                {/* Allocation Summary */}
                <section id="summary" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-emerald-600" />
                    Allocation Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalEmployeeQRE())}</div>
                      <div className="text-sm text-blue-700">Employee QRE</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                      <Building2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(getTotalContractorQRE())}</div>
                      <div className="text-sm text-orange-700">Contractor QRE</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                      <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(getTotalSupplyQRE())}</div>
                      <div className="text-sm text-purple-700">Supply QRE</div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationReportModal; 