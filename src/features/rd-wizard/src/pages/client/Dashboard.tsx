import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRightIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  CalendarIcon,
  LockClosedIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { cn } from '../../utils/styles';
import Modal from '../../components/common/Modal';
import useBusinessStore from '../../store/businessStore';
import useActivitiesStore from '../../store/activitiesStore';
import useExpenseStore from '../../store/expenseStore';
import useStaffStore from '../../store/staffStore';
import useResearchNotesStore from '../../store/researchNotesStore';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
} from 'chart.js';
import { useUser } from '../../context/UserContext';
import { getBusinessesForUser } from '../../services/businessService';
import ImpersonationBanner from '../../components/common/ImpersonationBanner';
import { getPendingChangesForClient, updatePendingChangeStatus } from '../../services/pendingChangesService';
import { createChangelogEntry } from '../../services/changelogService';
import { demoActivities, demoExpenses, demoDocuments } from '../../data/demoSeed';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [selectedYearModal, setSelectedYearModal] = useState<number | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = React.useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = React.useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingChangeId, setProcessingChangeId] = useState<string | null>(null);
  
  // Get business info from store
  const { yearStarted, historicalData, businessName, setCurrentYear } = useBusinessStore();
  const expenseStore = useExpenseStore();
  const staffStore = useStaffStore();
  const activitiesStore = useActivitiesStore();
  const researchNotesStore = useResearchNotesStore();
  
  // Calculate available years
  const currentYear = new Date().getFullYear();
  
  // Calculate open years (current year plus three previous, but not before business started)
  const openYears = useMemo(() => {
    const years = [];
    for (let year = currentYear; year > currentYear - 4; year--) {
      if (year >= yearStarted) {
        years.push(year);
      }
    }
    return years;
  }, [currentYear, yearStarted]);

  // Get credit amounts from historical data
  const getEstimatedCredit = (year: number) => {
    return historicalData[year]?.qre ? `$${(historicalData[year].qre * 0.14).toLocaleString()}` : '$0';
  };

  // Calculate QRE composition for a given year
  const getQREComposition = (year: number) => {
    const employees = staffStore.employees;
    const contractorExpenses = Object.values(expenseStore.contractorExpenses)
      .filter(expense => expense.year === year);
    const supplyExpenses = Object.values(expenseStore.supplyExpenses)
      .filter(expense => expense.year === year);

    // Calculate wage QRE
    const wageQRE = employees.reduce((total, emp) => {
      const yearActivities = emp.yearlyActivities[year] || {};
      const empTotal = Object.values(yearActivities).reduce((sum: number, act: any) => {
        if (!act?.isSelected) return sum;
        return sum + ((act.percentage || 0) * (emp.annualWage || 0) / 100);
      }, 0);
      return total + empTotal;
    }, 0);

    // Calculate contractor QRE
    const contractorQRE = contractorExpenses.reduce((total, expense) => {
      return total + ((expense.amount || 0) * (expense.researchPercentage || 0) / 100);
    }, 0);

    // Calculate supply QRE
    const supplyQRE = supplyExpenses.reduce((total, expense) => {
      return total + ((expense.amount || 0) * (expense.researchPercentage || 0) / 100);
    }, 0);

    return {
      wages: wageQRE,
      contractors: contractorQRE,
      supplies: supplyQRE
    };
  };

  // Fetch business data from Supabase
  React.useEffect(() => {
    if (!user) return;
    setBusinessLoading(true);
    getBusinessesForUser(user.id).then(({ data, error }) => {
      if (error) {
        setBusinessLoading(false);
        setToast({ type: 'error', message: error });
        return;
      }
      if (data && data.length > 0) {
        setBusiness(data[0]); // Assume first business for now
      }
      setBusinessLoading(false);
    });
  }, [user]);

  // Fetch pending changes for this client
  React.useEffect(() => {
    if (!user) return;
    setPendingLoading(true);
    getPendingChangesForClient(user.id).then(({ data }) => {
      setPendingChanges(data || []);
      setPendingLoading(false);
    });
  }, [user]);

  // Fallbacks for business data
  const yearStartedFallback = business?.year_started || new Date().getFullYear();
  const businessNameFallback = business?.name || '';
  const historicalDataFallback = business?.historical_data || {};

  const handleApproveChange = async (change: any) => {
    setProcessingChangeId(change.id);
    await updatePendingChangeStatus(change.id, 'approved');
    setPendingChanges(pendingChanges.filter(c => c.id !== change.id));
    // Apply the change to demo data
    if (change.change_type === 'activity_status_update') {
      const idx = demoActivities.findIndex(a => a.id === change.change_details.activity_id);
      if (idx !== -1) demoActivities[idx].status = change.change_details.new_status;
    } else if (change.change_type === 'expense_status_update') {
      const idx = demoExpenses.findIndex(e => e.id === change.change_details.expense_id);
      if (idx !== -1) demoExpenses[idx].status = change.change_details.new_status;
    } else if (change.change_type === 'document_status_update') {
      const idx = demoDocuments.findIndex(d => d.id === change.change_details.document_id);
      if (idx !== -1) demoDocuments[idx].review_status = change.change_details.new_status;
    }
    // Log changelog entry
    await createChangelogEntry({
      actor_id: change.proposed_by_admin_id,
      target_user_id: change.client_id,
      action: 'client_approved_change',
      details: `Client approved change: ${change.change_type}`,
      metadata: { ...change.change_details }
    });
    setToast({ type: 'success', message: 'Change approved and applied!' });
    setProcessingChangeId(null);
  };

  const handleRejectChange = async (changeId: string) => {
    setProcessingChangeId(changeId);
    await updatePendingChangeStatus(changeId, 'rejected');
    setPendingChanges(pendingChanges.filter(c => c.id !== changeId));
    setToast({ type: 'success', message: 'Change rejected.' });
    setProcessingChangeId(null);
  };

  return (
    <div className="space-y-8">
      <ImpersonationBanner />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['DM_Serif_Display'] text-4xl text-gray-900">
            {businessNameFallback ? `${businessNameFallback}'s Dashboard` : 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-['DM_Serif_Display'] text-gray-900">
            Welcome back
          </h2>
          <p className="text-gray-500">
            Track your R&D tax credit progress and complete any pending tasks
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{toast.message}</div>
      )}

      {/* Notification Badge/Card for Pending Changes */}
      {pendingChanges.length > 0 && (
        <div className="bg-blue-100 border border-blue-300 text-blue-900 px-4 py-2 rounded flex items-center justify-between mb-4">
          <span>
            <strong>Action Required:</strong> You have {pendingChanges.length} pending change(s) to review.
          </span>
          <Button size="sm" variant="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Review Now
          </Button>
        </div>
      )}

      {/* Pending Changes List */}
      {pendingChanges.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-2">Pending Changes for Your Approval</h2>
          {pendingLoading ? (
            <div>Loading...</div>
          ) : (
            <ul className="space-y-4">
              {pendingChanges.map(change => (
                <li key={change.id} className="border-b pb-2">
                  <div className="mb-1">
                    <span className="font-semibold">Type:</span> {change.change_type.replace('_', ' ')}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Details:</span> {JSON.stringify(change.change_details)}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="success" onClick={() => handleApproveChange(change)} disabled={processingChangeId === change.id}>
                      {processingChangeId === change.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleRejectChange(change.id)} disabled={processingChangeId === change.id}>
                      {processingChangeId === change.id ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {pendingChanges.length === 0 && !pendingLoading && (
        <Card className="mb-6 text-center text-gray-500 py-8">
          <span>No pending changes for your approval. You're all caught up!</span>
        </Card>
      )}

      {/* Tax Year Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {openYears.map((year, index) => {
          const qreComposition = getQREComposition(year);
          const totalQRE = qreComposition.wages + qreComposition.contractors + qreComposition.supplies;

          // Determine if QREs are entered manually (simulate with a flag for now)
          const manuallyEnteredQRE = historicalData[year] && 'enteredManually' in historicalData[year] ? historicalData[year].enteredManually : false;
          const hasQREData = totalQRE > 0 || manuallyEnteredQRE;

          // Status logic
          const now = new Date();
          const julyCutoff = new Date(now.getFullYear() - 4, 6, 1); // July = month 6
          let status = 'Not Started';
          if (year < julyCutoff.getFullYear() || (year === julyCutoff.getFullYear() && now > julyCutoff)) {
            status = 'Closed';
          } else if (historicalData[year]?.paid) {
            status = 'Complete';
          } else if (hasQREData) {
            status = 'In Progress';
          }

          // Bar chart data
          let barData, barOptions;
          if (manuallyEnteredQRE) {
            barData = {
              labels: ['QRE'],
              datasets: [
                {
                  label: 'Entered',
                  data: [historicalData[year]?.qre || 0],
                  backgroundColor: '#4B5563', // dark gray
                  barPercentage: 1.0,
                  categoryPercentage: 1.0,
                  borderRadius: 6,
                  stack: 'Stack 0',
                },
              ],
            };
          } else if (totalQRE > 0) {
            barData = {
              labels: ['QRE'],
              datasets: [
                {
                  label: 'Wages',
                  data: [qreComposition.wages],
                  backgroundColor: '#F59E42', // orange
                  barPercentage: 1.0,
                  categoryPercentage: 1.0,
                  borderRadius: 6,
                  stack: 'Stack 0',
                },
                {
                  label: 'Contractor',
                  data: [qreComposition.contractors],
                  backgroundColor: '#A78BFA', // purple
                  barPercentage: 1.0,
                  categoryPercentage: 1.0,
                  borderRadius: 6,
                  stack: 'Stack 0',
                },
                {
                  label: 'Supplies',
                  data: [qreComposition.supplies],
                  backgroundColor: '#60A5FA', // blue
                  barPercentage: 1.0,
                  categoryPercentage: 1.0,
                  borderRadius: 6,
                  stack: 'Stack 0',
                },
              ],
            };
          } else {
            barData = {
              labels: ['QRE'],
              datasets: [
                {
                  label: 'No Data',
                  data: [1],
                  backgroundColor: '#E5E7EB', // light gray
                  barPercentage: 1.0,
                  categoryPercentage: 1.0,
                  borderRadius: 6,
                  stack: 'Stack 0',
                },
              ],
            };
          }
          barOptions = {
            indexAxis: 'y' as const,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true },
            },
            scales: {
              x: {
                display: false,
                stacked: true,
                min: 0,
                max: manuallyEnteredQRE ? (historicalData[year]?.qre || 1) : (totalQRE > 0 ? totalQRE : 1),
              },
              y: {
                display: false,
                stacked: true,
              },
            },
          };

          // Color strips for each card
          const colorStrips = [
            'from-blue-600 to-purple-600',
            'from-purple-600 to-indigo-600',
            'from-green-600 to-emerald-600',
            'from-orange-600 to-amber-600',
          ];

          // Credit values
          const totalCredit = historicalData[year]?.qre ? historicalData[year].qre * 0.14 : null;
          const federalCredit = historicalData[year] && 'federalCredit' in historicalData[year]
            ? (historicalData[year].federalCredit ?? null)
            : (totalCredit ? Math.round(totalCredit * 0.75) : null);
          const stateCredit = historicalData[year] && 'stateCredit' in historicalData[year]
            ? (historicalData[year].stateCredit ?? null)
            : (totalCredit ? Math.round(totalCredit * 0.25) : null);

          // Status pill color
          const statusColor = status === 'Closed' ? 'bg-gray-200 text-gray-600' :
            status === 'Complete' ? 'bg-blue-100 text-blue-700' :
            status === 'In Progress' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-500';

          return (
            <Card key={year} className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm p-0">
              <div 
                className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${colorStrips[index % colorStrips.length]}`}
                style={{ borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem' }}
              />
              <div className="flex flex-col h-full px-4 pt-3 pb-4">
                {/* Top Row: Year, Status, Icons */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[1rem] text-gray-700">Tax Year</span>
                      <span className="font-bold text-[1.35rem] text-blue-900 leading-none">{year}</span>
                    </div>
                    <span className={`mt-1 inline-block text-xs font-semibold px-3 py-0.5 rounded-full ${statusColor}`}>{status}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <button
                      className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 shadow-sm border border-gray-200"
                      onClick={() => setSelectedYearModal(year)}
                      aria-label="View details"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 shadow-sm border border-gray-200"
                      onClick={() => {
                        setCurrentYear(year);
                        navigate('/client/qualified-activities');
                      }}
                      aria-label="Go to Qualified Activities"
                    >
                      <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Credit Values */}
                <div className="mt-2 mb-1">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[1.1rem] font-bold text-purple-700 leading-tight">Total</span>
                    <span className="text-[1.7rem] font-extrabold text-gray-900 leading-tight">{totalCredit !== null ? `$${totalCredit.toLocaleString()}` : <span className="text-gray-400">n/a</span>}</span>
                    <span className="text-[1.05rem] text-green-600 font-semibold">{federalCredit !== null ? `$${federalCredit.toLocaleString()}` : <span className="text-gray-400">n/a`</span>} <span className="font-normal text-green-700">Federal</span></span>
                    <span className="text-[1.05rem] text-blue-400 font-semibold">{stateCredit !== null ? `$${stateCredit.toLocaleString()}` : <span className="text-gray-400">n/a`</span>} <span className="font-normal text-blue-700">State</span></span>
                  </div>
                </div>

                {/* QRE Bar Chart */}
                <div className="mt-2 mb-1 flex flex-col items-center">
                  <div style={{ width: '100%', height: '28px', minWidth: '120px', maxWidth: '220px' }}>
                    <Bar data={barData} options={barOptions} />
                  </div>
                  {/* Legend */}
                  <div className="flex justify-center space-x-4 mt-2">
                    {manuallyEnteredQRE ? (
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 rounded-full bg-[#4B5563] inline-block" />
                        <span className="text-xs text-gray-500">Entered</span>
                      </div>
                    ) : totalQRE > 0 ? (
                      <>
                        <div className="flex items-center space-x-1">
                          <span className="w-3 h-3 rounded-full bg-[#F59E42] inline-block" />
                          <span className="text-xs text-gray-500">Wages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="w-3 h-3 rounded-full bg-[#A78BFA] inline-block" />
                          <span className="text-xs text-gray-500">Contractor</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="w-3 h-3 rounded-full bg-[#60A5FA] inline-block" />
                          <span className="text-xs text-gray-500">Supplies</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 rounded-full bg-[#E5E7EB] inline-block" />
                        <span className="text-xs text-gray-400">n/a</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QRE Trends</h3>
            <div style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: openYears.reverse(),
                  datasets: [
                    {
                      label: 'Wages',
                      data: openYears.map(year => getQREComposition(year).wages),
                      backgroundColor: '#4F46E5'
                    },
                    {
                      label: 'Contractors',
                      data: openYears.map(year => getQREComposition(year).contractors),
                      backgroundColor: '#7C3AED'
                    },
                    {
                      label: 'Supplies',
                      data: openYears.map(year => getQREComposition(year).supplies),
                      backgroundColor: '#2563EB'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    x: {
                      stacked: true
                    },
                    y: {
                      stacked: true,
                      ticks: {
                        callback: (value) => '$' + Number(value).toLocaleString()
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Trends</h3>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: openYears,
                  datasets: [
                    {
                      label: 'Federal Credit',
                      data: openYears.map(year => {
                        const credit = historicalData[year]?.qre ? historicalData[year].qre * 0.14 : 0;
                        return credit;
                      }),
                      borderColor: '#4F46E5',
                      backgroundColor: '#4F46E5',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: (value) => '$' + Number(value).toLocaleString()
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Research Activities Card */}
      <Card>
        <div 
          className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-orange-500 to-red-600"
          style={{ borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}
        />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Research Activities</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/client/qualified-activities')}
            >
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Next Update Countdown */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-800 mb-2">Next Update Due</h4>
              <div className="text-2xl font-bold text-orange-600">
                {researchNotesStore.getDaysUntilNextUpdate()} days
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Update your research notes by{' '}
                {new Date(new Date().setDate(new Date().getDate() + researchNotesStore.getDaysUntilNextUpdate())).toLocaleDateString()}
              </p>
            </div>

            {/* Research Notes Summary */}
            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Latest Research Notes</h4>
              <div className="space-y-3">
                {researchNotesStore.getLatestNotes(2).map((note, index) => (
                  <div key={note.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-purple-600'} mt-2`}></div>
                    <div>
                      <p className="text-sm text-gray-600">{note.content}</p>
                      <p className="text-xs text-gray-400">
                        Added {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Research Metrics */}
          <div className="mt-6">
            <div className="grid grid-cols-3 gap-4">
              {(() => {
                const metrics = researchNotesStore.getMetricsSummary();
                return (
                  <>
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="text-sm text-gray-500">Total Activities</div>
                      <div className="text-xl font-semibold text-gray-900 mt-1">
                        {metrics.totalActivities}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="text-sm text-gray-500">Data Points</div>
                      <div className="text-xl font-semibold text-gray-900 mt-1">
                        {metrics.totalDataPoints}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="text-sm text-gray-500">Success Rate</div>
                      <div className="text-xl font-semibold text-gray-900 mt-1">
                        {metrics.averageSuccessRate}%
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </Card>

      {/* Year Summary Modal */}
      {selectedYearModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedYearModal(null)}
          title={`Tax Year ${selectedYearModal} Summary`}
        >
          <div className="space-y-6 p-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">QRE Breakdown</h3>
              {(() => {
                const composition = getQREComposition(selectedYearModal);
                const total = composition.wages + composition.contractors + composition.supplies;
                return (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Qualified Wages</span>
                      <span className="font-medium">${composition.wages.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Contractor Expenses</span>
                      <span className="font-medium">${composition.contractors.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Supply Expenses</span>
                      <span className="font-medium">${composition.supplies.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Total QRE</span>
                        <span className="font-bold text-blue-600">${total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Credit Calculation</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Estimated Federal Credit</span>
                  <span className="font-medium">{getEstimatedCredit(selectedYearModal)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedYearModal(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientDashboard;