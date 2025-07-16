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
  subcomponents: Array<{
    name: string;
    applied_percentage: number;
    color: string;
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

      // Load employees with subcomponent data
      const { data: employeeData, error: empError } = await supabase
        .from('rd_employee_subcomponents')
        .select(`
          *,
          rd_employees!inner(id, first_name, last_name, annual_wage),
          rd_research_subcomponents!inner(id, name)
        `)
        .eq('business_year_id', selectedYear.id)
        .eq('is_included', true);

      if (empError) throw empError;

      // Process employee data
      const processedEmployees = processEmployeeData(employeeData || []);
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

  const processEmployeeData = (data: any[]): EmployeeData[] => {
    const employeeMap = new Map<string, EmployeeData>();
    
    data.forEach(item => {
      const empId = item.rd_employees.id;
      const empName = `${item.rd_employees.first_name} ${item.rd_employees.last_name}`;
      
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          id: empId,
          name: empName,
          total_qre: item.rd_employees.annual_wage || 0,
          applied_percentage: 0,
          subcomponents: []
        });
      }
      
      const employee = employeeMap.get(empId)!;
      const subcompName = item.rd_research_subcomponents.name;
      
      // Assign color to subcomponent
      if (!subcomponentColors[subcompName]) {
        const colorIndex = Object.keys(subcomponentColors).length % SUBCOMPONENT_COLORS.length;
        subcomponentColors[subcompName] = SUBCOMPONENT_COLORS[colorIndex];
      }
      
      employee.subcomponents.push({
        name: subcompName,
        applied_percentage: item.applied_percentage || 0,
        color: subcomponentColors[subcompName]
      });
      
      employee.applied_percentage += item.applied_percentage || 0;
    });
    
    return Array.from(employeeMap.values());
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
    return employees.reduce((sum, emp) => sum + (emp.total_qre * (emp.applied_percentage / 100)), 0);
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 40px; text-align: center; margin-bottom: 30px; }
        .logo { display: inline-block; margin-bottom: 20px; }
        .logo img { height: 60px; }
        .title { font-size: 2.5rem; font-weight: 700; margin-bottom: 10px; }
        .subtitle { font-size: 1.2rem; opacity: 0.9; }
        .report-meta { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .meta-item { text-align: center; }
        .meta-label { font-size: 0.875rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .meta-value { font-size: 1.125rem; font-weight: 600; color: #1f2937; }
        .section { margin-bottom: 40px; }
        .section-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 20px; color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        .summary-value { font-size: 2rem; font-weight: 700; color: #10b981; }
        .summary-label { font-size: 0.875rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .allocation-section { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .allocation-header { display: flex; align-items: center; margin-bottom: 15px; }
        .allocation-icon { margin-right: 10px; }
        .allocation-title { font-size: 1.25rem; font-weight: 600; }
        .allocation-item { display: flex; justify-content: between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .allocation-item:last-child { border-bottom: none; }
        .item-name { flex: 1; font-weight: 500; }
        .item-amount { font-weight: 600; color: #10b981; }
        .progress-bar { width: 100%; height: 20px; background: #f3f4f6; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-segment { height: 100%; display: inline-block; }
        .no-data { text-align: center; color: #6b7280; font-style: italic; padding: 40px; }
        
        @media print {
            body { font-size: 12px; }
            .container { max-width: none; margin: 0; padding: 10px; }
            .header { background: #10b981 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
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
                    <div class="allocation-item">
                        <div class="item-name">${emp.name}</div>
                        <div class="item-amount">${formatCurrency(emp.total_qre * (emp.applied_percentage / 100))} (${formatPercentage(emp.applied_percentage)})</div>
                    </div>
                    <div class="progress-bar">
                        ${emp.subcomponents.map(sub => 
                            `<div class="progress-segment" style="width: ${(sub.applied_percentage / emp.applied_percentage) * 100}%; background-color: ${sub.color};" title="${sub.name}: ${formatPercentage(sub.applied_percentage)}"></div>`
                        ).join('')}
                    </div>
                `).join('') : '<div class="no-data">No employee data available</div>'}
            </div>
        </div>

        <!-- Contractor Allocations -->
        <div class="section">
            <h2 class="section-title">💼 Contractor Allocations</h2>
            <div class="allocation-section">
                ${contractors.length > 0 ? contractors.map(cont => `
                    <div class="allocation-item">
                        <div class="item-name">${cont.name}</div>
                        <div class="item-amount">${formatCurrency(cont.cost_amount * (cont.applied_percent / 100))} (${formatPercentage(cont.applied_percent)})</div>
                    </div>
                `).join('') : '<div class="no-data">No contractor data available</div>'}
            </div>
        </div>

        <!-- Supply Allocations -->
        <div class="section">
            <h2 class="section-title">📦 Supply Allocations</h2>
            <div class="allocation-section">
                ${supplies.length > 0 ? supplies.map(sup => `
                    <div class="allocation-item">
                        <div class="item-name">${sup.name}</div>
                        <div class="item-amount">${formatCurrency(sup.cost * (sup.applied_percentage / 100))} (${formatPercentage(sup.applied_percentage)})</div>
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
                className="flex items-center px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
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
                          <div key={emp.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{emp.name}</h3>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  {formatCurrency(emp.total_qre * (emp.applied_percentage / 100))}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatPercentage(emp.applied_percentage)} applied
                                </div>
                              </div>
                            </div>
                            {emp.subcomponents.length > 0 && (
                              <div>
                                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-2">
                                  {emp.subcomponents.map((sub, idx) => (
                                    <div
                                      key={idx}
                                      className="h-full inline-block"
                                      style={{
                                        width: `${(sub.applied_percentage / emp.applied_percentage) * 100}%`,
                                        backgroundColor: sub.color
                                      }}
                                      title={`${sub.name}: ${formatPercentage(sub.applied_percentage)}`}
                                    />
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {emp.subcomponents.map((sub, idx) => (
                                    <div key={idx} className="flex items-center text-xs">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: sub.color }}
                                      />
                                      <span>{sub.name}: {formatPercentage(sub.applied_percentage)}</span>
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