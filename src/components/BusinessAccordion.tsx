import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Building, 
  Calendar, 
  Plus, 
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Zap
} from 'lucide-react';
import { CentralizedClientService, ToolEnrollment, ClientTool } from '../services/centralizedClientService';
import { toast } from 'react-hot-toast';

interface BusinessAccordionProps {
  businesses: any[];
  clientId: string;
  onRefresh?: () => void;
}

interface BusinessYearCardProps {
  year: any;
  business: any;
  clientId: string;
  toolEnrollments: ClientTool[];
  onEnrollInTool: (businessId: string, year: number, toolSlug: ToolEnrollment['tool_slug']) => void;
  onRefresh: () => void;
}

const BusinessYearCard: React.FC<BusinessYearCardProps> = ({
  year,
  business,
  clientId,
  toolEnrollments,
  onEnrollInTool,
  onRefresh
}) => {
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnrollInTool = async (toolSlug: ToolEnrollment['tool_slug']) => {
    setIsEnrolling(true);
    try {
      console.log('[BusinessYearCard] Enrolling in tool:', toolSlug, 'for business:', business.id, 'client:', clientId);
      await CentralizedClientService.enrollClientInTool(clientId, business.id, toolSlug);
      console.log('[BusinessYearCard] Enrollment successful');
      toast.success(`Successfully enrolled in ${CentralizedClientService.getToolDisplayName(toolSlug)}`);
      onRefresh();
    } catch (error) {
      console.error('[BusinessYearCard] Enrollment error:', error);
      toast.error(`Failed to enroll in tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsEnrolling(false);
    }
  };



  const getToolStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getToolStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const availableTools: Array<{ slug: ToolEnrollment['tool_slug']; name: string; description: string }> = [
    {
      slug: 'rd',
      name: 'R&D Tax Credit Wizard',
      description: 'Calculate and optimize R&D tax credits for your business'
    }
    // Add more tools here as they become available
  ];

  const enrolledTools = toolEnrollments.filter(tool => 
    tool.tool_slug === 'rd' // For now, only show R&D tool enrollments
  );

  const isEnrolledInRd = enrolledTools.some(tool => tool.tool_slug === 'rd');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {year.year}
          </span>
          <div className="text-sm text-gray-600">
            <span className="flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              ${(year.ordinary_k1_income + year.guaranteed_k1_income).toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {year.employee_count} employees
            </span>
          </div>
        </div>
      </div>

      {/* Tool Enrollments */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-gray-900">Tool Enrollments</h5>
        
        {enrolledTools.length > 0 ? (
          <div className="space-y-2">
            {enrolledTools.map((tool) => (
              <div key={tool.tool_slug} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  {getToolStatusIcon(tool.status)}
                  <span className="text-sm font-medium">{tool.tool_name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getToolStatusColor(tool.status)}`}>
                    {tool.status}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const url = CentralizedClientService.getToolLaunchUrl(tool.tool_slug, clientId, business.id);
                    window.open(url, '_blank');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
            <FileText className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No tools enrolled for this year</p>
          </div>
        )}

        {/* Available Tools */}
        <div className="space-y-2">
          <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Available Tools</h6>
          

          
          {availableTools.map((tool) => {
            const isEnrolled = enrolledTools.some(t => t.tool_slug === tool.slug);
            return (
              <div key={tool.slug} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium">{tool.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
                </div>
                <button
                  onClick={() => handleEnrollInTool(tool.slug)}
                  disabled={isEnrolled || isEnrolling}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    isEnrolled
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isEnrolling ? 'Enrolling...' : isEnrolled ? 'Enrolled' : 'Enroll'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const BusinessAccordion: React.FC<BusinessAccordionProps> = ({
  businesses,
  clientId,
  onRefresh
}) => {
  const [expandedBusinessId, setExpandedBusinessId] = useState<string | null>(null);
  const [businessToolEnrollments, setBusinessToolEnrollments] = useState<Record<string, ClientTool[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Load tool enrollments for each business
  useEffect(() => {
    const loadToolEnrollments = async () => {
      const enrollments: Record<string, ClientTool[]> = {};
      
      for (const business of businesses) {
        try {
          const tools = await CentralizedClientService.getClientTools(clientId, business.id);
          enrollments[business.id] = tools;
        } catch (error) {
          console.error(`Error loading tools for business ${business.id}:`, error);
          enrollments[business.id] = [];
        }
      }
      
      setBusinessToolEnrollments(enrollments);
    };

    if (businesses.length > 0) {
      loadToolEnrollments();
    }
  }, [businesses, clientId]);

  const handleEnrollInTool = async (
    businessId: string, 
    year: number, 
    toolSlug: ToolEnrollment['tool_slug']
  ) => {
    setLoading(prev => ({ ...prev, [businessId]: true }));
    try {
      console.log('[BusinessAccordion] Enrolling business in tool:', toolSlug, clientId, businessId);
      await CentralizedClientService.enrollClientInTool(clientId, businessId, toolSlug);
      console.log('[BusinessAccordion] enrollClientInTool returned for tool:', toolSlug);
      // Refresh tool enrollments for this business
      const tools = await CentralizedClientService.getClientTools(clientId, businessId);
      setBusinessToolEnrollments(prev => ({
        ...prev,
        [businessId]: tools
      }));
      if (onRefresh) {
        onRefresh();
      }
    } finally {
      setLoading(prev => ({ ...prev, [businessId]: false }));
    }
  };

  const toggleBusiness = (businessId: string) => {
    setExpandedBusinessId(expandedBusinessId === businessId ? null : businessId);
  };

  if (businesses.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No businesses found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {businesses.map((business) => {
        const isExpanded = expandedBusinessId === business.id;
        const toolEnrollments = businessToolEnrollments[business.id] || [];
        const isLoading = loading[business.id] || false;

        return (
          <div key={business.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Business Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleBusiness(business.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-purple-500" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {business.business_name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {business.entity_type || 'LLC'}
                      </span>
                      {business.ein && (
                        <span className="text-xs text-gray-500">
                          EIN: {business.ein}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {business.business_years?.length || 0} year{business.business_years?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Business Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="border-t border-gray-100 bg-gray-50"
                >
                  <div className="p-4">
                    {business.business_years && business.business_years.length > 0 ? (
                      <div className="space-y-3">
                        {business.business_years
                          .sort((a: any, b: any) => b.year - a.year) // Sort by year descending
                          .map((year: any) => (
                            <BusinessYearCard
                              key={year.id}
                              year={year}
                              business={business}
                              clientId={clientId}
                              toolEnrollments={toolEnrollments}
                              onEnrollInTool={handleEnrollInTool}
                              onRefresh={() => onRefresh?.()}
                            />
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No business years found</p>
                        <p className="text-xs text-gray-400 mt-1">Add business years to enroll in tools</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default BusinessAccordion; 