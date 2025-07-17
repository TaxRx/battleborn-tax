// Epic 3 Sprint 2 Day 3: Enhanced Tool Management Tests
// File: enhanced-tool-management.test.ts
// Purpose: Comprehensive tests for Story 2.2 and 2.3 implementations

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedToolManagement } from '../components/tools/EnhancedToolManagement';
import { ToolAssignmentModal } from '../components/tools/ToolAssignmentModal';
import { BulkToolOperations } from '../components/tools/BulkToolOperations';
import AdminToolService from '../services/adminToolService';

// Mock the AdminToolService
jest.mock('../services/adminToolService');

describe('Enhanced Tool Management - Story 2.2 & 2.3', () => {
  const mockAdminToolService = AdminToolService.getInstance() as jest.Mocked<AdminToolService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock service responses
    mockAdminToolService.getToolAssignmentMatrix.mockResolvedValue({
      assignments: [
        {
          account_id: '1',
          tool_id: '1',
          account_name: 'Test Account',
          account_type: 'client',
          tool_name: 'Test Tool',
          tool_slug: 'test-tool',
          access_level: 'read',
          subscription_level: 'premium',
          status: 'active',
          expires_at: '2025-08-01T00:00:00Z',
          granted_at: '2025-07-01T00:00:00Z',
          last_accessed_at: null,
          created_by_name: 'Admin User',
          updated_by_name: null,
          notes: 'Test assignment',
          features_enabled: { advanced_reporting: true },
          usage_limits: { api_calls_per_month: 1000 },
          is_expired: false,
          expires_soon: false
        }
      ],
      accounts: [
        {
          id: '1',
          name: 'Test Account',
          email: 'test@example.com',
          type: 'client',
          status: 'active',
          created_at: '2025-07-01T00:00:00Z'
        }
      ],
      tools: [
        {
          id: '1',
          name: 'Test Tool',
          slug: 'test-tool',
          category: 'analytics',
          description: 'Test tool description',
          status: 'active'
        }
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        pages: 1
      }
    });

    mockAdminToolService.getExpiringAssignments.mockResolvedValue([]);
    mockAdminToolService.getAllTools.mockResolvedValue([
      {
        id: '1',
        name: 'Test Tool',
        slug: 'test-tool',
        category: 'analytics',
        description: 'Test tool description',
        status: 'active'
      }
    ]);
    mockAdminToolService.getAccountsForMatrix.mockResolvedValue([
      {
        id: '1',
        name: 'Test Account',
        email: 'test@example.com',
        type: 'client',
        status: 'active',
        created_at: '2025-07-01T00:00:00Z'
      }
    ]);
  });

  describe('Story 2.2: Individual Tool Assignment', () => {
    describe('Enhanced Assignment Modal', () => {
      it('should display subscription levels with descriptions', async () => {
        render(
          <ToolAssignmentModal
            isOpen={true}
            onClose={() => {}}
            mode="create"
          />
        );

        await waitFor(() => {
          expect(screen.getByText('Basic')).toBeInTheDocument();
          expect(screen.getByText('Premium')).toBeInTheDocument();
          expect(screen.getByText('Enterprise')).toBeInTheDocument();
        });

        // Check for subscription descriptions
        expect(screen.getByText('Essential features with standard support')).toBeInTheDocument();
        expect(screen.getByText('Enhanced features with priority support')).toBeInTheDocument();
      });

      it('should show advanced options when toggled', async () => {
        const user = userEvent.setup();
        
        render(
          <ToolAssignmentModal
            isOpen={true}
            onClose={() => {}}
            mode="create"
          />
        );

        // Find and click advanced options toggle
        const advancedToggle = screen.getByText('Advanced Options');
        await user.click(advancedToggle);

        await waitFor(() => {
          expect(screen.getByText('Feature Access')).toBeInTheDocument();
          expect(screen.getByText('Notification Settings')).toBeInTheDocument();
        });
      });

      it('should validate trial subscription expiration requirements', async () => {
        const user = userEvent.setup();
        
        render(
          <ToolAssignmentModal
            isOpen={true}
            onClose={() => {}}
            mode="create"
          />
        );

        // Select trial subscription
        const trialButton = screen.getByText('Trial');
        await user.click(trialButton);

        // Try to submit without expiration date
        const submitButton = screen.getByText('Assign Tool');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText('Trial subscriptions must have an expiration date')).toBeInTheDocument();
        });
      });

      it('should handle auto-renewal settings', async () => {
        const user = userEvent.setup();
        
        render(
          <ToolAssignmentModal
            isOpen={true}
            onClose={() => {}}
            mode="create"
          />
        );

        // Set an expiration date first
        const expirationInput = screen.getByLabelText(/expiration date/i);
        await user.type(expirationInput, '2025-12-31');

        // Enable auto-renewal
        const autoRenewalCheckbox = screen.getByLabelText(/enable auto-renewal/i);
        await user.click(autoRenewalCheckbox);

        await waitFor(() => {
          expect(screen.getByText('Renewal Period')).toBeInTheDocument();
          expect(screen.getByDisplayValue('monthly')).toBeInTheDocument();
        });
      });

      it('should display usage limits for enterprise subscriptions', async () => {
        const user = userEvent.setup();
        
        render(
          <ToolAssignmentModal
            isOpen={true}
            onClose={() => {}}
            mode="create"
          />
        );

        // Select enterprise subscription
        const enterpriseButton = screen.getByText('Enterprise');
        await user.click(enterpriseButton);

        // Open advanced options
        const advancedToggle = screen.getByText('Advanced Options');
        await user.click(advancedToggle);

        await waitFor(() => {
          expect(screen.getByText('Usage Limits & Quotas')).toBeInTheDocument();
          expect(screen.getByText('API Calls per Month')).toBeInTheDocument();
          expect(screen.getByText('Storage Limit')).toBeInTheDocument();
        });
      });
    });

    describe('Enhanced Activity Logging', () => {
      it('should log comprehensive assignment metadata', async () => {
        mockAdminToolService.assignTool.mockResolvedValue({
          account_id: '1',
          tool_id: '1',
          account_name: 'Test Account',
          account_type: 'client',
          tool_name: 'Test Tool',
          tool_slug: 'test-tool',
          access_level: 'read',
          subscription_level: 'premium',
          status: 'active',
          expires_at: '2025-08-01T00:00:00Z',
          granted_at: '2025-07-01T00:00:00Z',
          last_accessed_at: null,
          created_by_name: 'Admin User',
          updated_by_name: null,
          notes: 'Test assignment',
          features_enabled: { advanced_reporting: true },
          usage_limits: { api_calls_per_month: 1000 },
          is_expired: false,
          expires_soon: false
        });

        const user = userEvent.setup();
        
        render(
          <ToolAssignmentModal
            isOpen={true}
            onClose={() => {}}
            mode="create"
            accountId="1"
            toolId="1"
          />
        );

        // Submit the form
        const submitButton = screen.getByText('Assign Tool');
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockAdminToolService.assignTool).toHaveBeenCalledWith(
            expect.objectContaining({
              accountId: '1',
              toolId: '1',
              notificationSettings: expect.any(Object),
              autoRenewal: expect.any(Boolean),
              renewalPeriod: expect.any(String)
            })
          );
        });
      });
    });
  });

  describe('Story 2.3: Bulk Tool Operations', () => {
    describe('Enhanced Bulk Operations Interface', () => {
      it('should display operation types with icons', async () => {
        render(
          <BulkToolOperations
            isOpen={true}
            onClose={() => {}}
            selectedAccountIds={['1']}
          />
        );

        await waitFor(() => {
          expect(screen.getByText('Assign Tools')).toBeInTheDocument();
          expect(screen.getByText('Update Subscription')).toBeInTheDocument();
          expect(screen.getByText('Export Assignments')).toBeInTheDocument();
        });
      });

      it('should validate tool selection for assign operations', async () => {
        const user = userEvent.setup();
        
        render(
          <BulkToolOperations
            isOpen={true}
            onClose={() => {}}
            selectedAccountIds={['1']}
          />
        );

        // Select assign operation
        const assignRadio = screen.getByLabelText(/assign tools/i);
        await user.click(assignRadio);

        // Try to submit without selecting tools
        const submitButton = screen.getByText('Execute Operation');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText('Please select at least one tool to assign')).toBeInTheDocument();
        });
      });

      it('should show progress tracking during operations', async () => {
        mockAdminToolService.bulkAssignTools.mockImplementation(async () => {
          // Simulate progress updates
          return {
            success: true,
            processed: 2,
            failed: 0,
            errors: [],
            operationId: 'test-operation-123'
          };
        });

        const user = userEvent.setup();
        
        render(
          <BulkToolOperations
            isOpen={true}
            onClose={() => {}}
            selectedAccountIds={['1', '2']}
          />
        );

        // Select assign operation and tools
        const assignRadio = screen.getByLabelText(/assign tools/i);
        await user.click(assignRadio);

        await waitFor(() => {
          const toolCheckbox = screen.getByLabelText(/test tool/i);
          user.click(toolCheckbox);
        });

        // Submit the operation
        const submitButton = screen.getByText('Execute Operation');
        await user.click(submitButton);

        // Check for progress tracking
        await waitFor(() => {
          expect(screen.getByText('Operation Progress')).toBeInTheDocument();
        });
      });

      it('should handle import file selection', async () => {
        const user = userEvent.setup();
        
        render(
          <BulkToolOperations
            isOpen={true}
            onClose={() => {}}
            selectedAccountIds={['1']}
            showExportImport={true}
          />
        );

        // Select import operation
        const importRadio = screen.getByLabelText(/import assignments/i);
        await user.click(importRadio);

        await waitFor(() => {
          expect(screen.getByText('Import File')).toBeInTheDocument();
          expect(screen.getByText('Supported formats: CSV, Excel (.xlsx, .xls)')).toBeInTheDocument();
        });
      });
    });

    describe('Progress Tracking System', () => {
      it('should display individual progress steps', async () => {
        mockAdminToolService.bulkAssignTools.mockImplementation(async () => {
          return {
            success: true,
            processed: 1,
            failed: 0,
            errors: [],
            operationId: 'test-operation-456'
          };
        });

        const user = userEvent.setup();
        
        render(
          <BulkToolOperations
            isOpen={true}
            onClose={() => {}}
            selectedAccountIds={['1']}
          />
        );

        // Set up and submit operation
        const assignRadio = screen.getByLabelText(/assign tools/i);
        await user.click(assignRadio);

        await waitFor(async () => {
          const toolCheckbox = screen.getByLabelText(/test tool/i);
          await user.click(toolCheckbox);
        });

        const submitButton = screen.getByText('Execute Operation');
        await user.click(submitButton);

        // Verify progress steps are shown
        await waitFor(() => {
          expect(screen.getByText('Validating operation')).toBeInTheDocument();
          expect(screen.getByText('Preparing data')).toBeInTheDocument();
          expect(screen.getByText('Processing assignments')).toBeInTheDocument();
        });
      });
    });

    describe('Error Handling and Recovery', () => {
      it('should handle and display operation errors', async () => {
        mockAdminToolService.bulkAssignTools.mockRejectedValue(
          new Error('Database connection failed')
        );

        const user = userEvent.setup();
        
        render(
          <BulkToolOperations
            isOpen={true}
            onClose={() => {}}
            selectedAccountIds={['1']}
          />
        );

        // Set up and submit operation
        const assignRadio = screen.getByLabelText(/assign tools/i);
        await user.click(assignRadio);

        await waitFor(async () => {
          const toolCheckbox = screen.getByLabelText(/test tool/i);
          await user.click(toolCheckbox);
        });

        const submitButton = screen.getByText('Execute Operation');
        await user.click(submitButton);

        // Verify error is displayed
        await waitFor(() => {
          expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        });
      });

      it('should show partial success results', async () => {
        mockAdminToolService.bulkAssignTools.mockResolvedValue({
          success: false,
          processed: 3,
          failed: 2,
          errors: [
            { accountId: '1', error: 'Permission denied' },
            { accountId: '2', error: 'Tool not found' }
          ],
          operationId: 'test-operation-789'
        });

        const user = userEvent.setup();
        
        render(
          <BulkToolOperations
            isOpen={true}
            onClose={() => {}}
            selectedAccountIds={['1', '2', '3', '4', '5']}
          />
        );

        // Execute operation
        const assignRadio = screen.getByLabelText(/assign tools/i);
        await user.click(assignRadio);

        await waitFor(async () => {
          const toolCheckbox = screen.getByLabelText(/test tool/i);
          await user.click(toolCheckbox);
        });

        const submitButton = screen.getByText('Execute Operation');
        await user.click(submitButton);

        // Verify partial success display
        await waitFor(() => {
          expect(screen.getByText('3 processed successfully, 2 failed')).toBeInTheDocument();
          expect(screen.getByText('View 2 errors')).toBeInTheDocument();
        });
      });
    });
  });

  describe('Enhanced Tool Management Dashboard', () => {
    it('should display tool management statistics', async () => {
      render(<EnhancedToolManagement />);

      await waitFor(() => {
        expect(screen.getByText('Total Assignments')).toBeInTheDocument();
        expect(screen.getByText('Active Assignments')).toBeInTheDocument();
        expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
        expect(screen.getByText('Recent Operations')).toBeInTheDocument();
      });
    });

    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedToolManagement />);

      // Click Analytics tab
      const analyticsTab = screen.getByText('Analytics');
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('Subscription Distribution')).toBeInTheDocument();
      });

      // Click Notifications tab
      const notificationsTab = screen.getByText('Notifications');
      await user.click(notificationsTab);

      await waitFor(() => {
        expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
      });
    });

    it('should open modals from dashboard actions', async () => {
      const user = userEvent.setup();
      
      render(<EnhancedToolManagement />);

      // Click New Assignment button
      const newAssignmentButton = screen.getByText('New Assignment');
      await user.click(newAssignmentButton);

      await waitFor(() => {
        expect(screen.getByText('Assign Tool')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should complete full assignment workflow', async () => {
      mockAdminToolService.assignTool.mockResolvedValue({
        account_id: '1',
        tool_id: '1',
        account_name: 'Test Account',
        account_type: 'client',
        tool_name: 'Test Tool',
        tool_slug: 'test-tool',
        access_level: 'write',
        subscription_level: 'premium',
        status: 'active',
        expires_at: '2025-12-31T00:00:00Z',
        granted_at: '2025-07-21T00:00:00Z',
        last_accessed_at: null,
        created_by_name: 'Admin User',
        updated_by_name: null,
        notes: 'Integration test assignment',
        features_enabled: { advanced_reporting: true, data_export: true },
        usage_limits: { api_calls_per_month: 5000 },
        is_expired: false,
        expires_soon: false
      });

      const onAssignmentComplete = jest.fn();
      const user = userEvent.setup();
      
      render(
        <ToolAssignmentModal
          isOpen={true}
          onClose={() => {}}
          mode="create"
          accountId="1"
          toolId="1"
          onAssignmentComplete={onAssignmentComplete}
        />
      );

      // Configure assignment
      const premiumButton = screen.getByText('Premium');
      await user.click(premiumButton);

      const writeRadio = screen.getByLabelText(/read\/write/i);
      await user.click(writeRadio);

      const expirationInput = screen.getByLabelText(/expiration date/i);
      await user.type(expirationInput, '2025-12-31');

      const notesTextarea = screen.getByPlaceholderText(/add any notes/i);
      await user.type(notesTextarea, 'Integration test assignment');

      // Submit assignment
      const submitButton = screen.getByText('Assign Tool');
      await user.click(submitButton);

      // Verify completion
      await waitFor(() => {
        expect(mockAdminToolService.assignTool).toHaveBeenCalledWith(
          expect.objectContaining({
            accountId: '1',
            toolId: '1',
            subscriptionLevel: 'premium',
            accessLevel: 'write',
            expiresAt: '2025-12-31',
            notes: 'Integration test assignment'
          })
        );
        expect(onAssignmentComplete).toHaveBeenCalled();
      });
    });

    it('should complete bulk operation workflow', async () => {
      mockAdminToolService.bulkAssignTools.mockResolvedValue({
        success: true,
        processed: 6,
        failed: 0,
        errors: [],
        operationId: 'bulk-test-123'
      });

      const onOperationComplete = jest.fn();
      const user = userEvent.setup();
      
      render(
        <BulkToolOperations
          isOpen={true}
          onClose={() => {}}
          selectedAccountIds={['1', '2', '3']}
          onOperationComplete={onOperationComplete}
        />
      );

      // Configure bulk operation
      const assignRadio = screen.getByLabelText(/assign tools/i);
      await user.click(assignRadio);

      await waitFor(async () => {
        const selectAllButton = screen.getByText('Select All');
        await user.click(selectAllButton);
      });

      const enterpriseSelect = screen.getByDisplayValue('basic');
      await user.selectOptions(enterpriseSelect, 'enterprise');

      // Execute operation
      const submitButton = screen.getByText('Execute Operation');
      await user.click(submitButton);

      // Verify completion
      await waitFor(() => {
        expect(mockAdminToolService.bulkAssignTools).toHaveBeenCalled();
        expect(onOperationComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            processed: 6,
            failed: 0
          })
        );
      });
    });
  });
});