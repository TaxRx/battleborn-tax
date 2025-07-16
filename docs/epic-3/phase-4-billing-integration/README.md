# Phase 4: Billing Integration (Weeks 10-12)

**Development Focus**: Invoice and subscription billing management  
**Phase Duration**: 3 weeks  
**Dependencies**: All previous phases (1-3) complete  
**Deliverables**: Comprehensive billing management with Stripe integration

## Phase Overview

Phase 4 completes the Epic 3 Admin Platform by implementing comprehensive billing management capabilities. This phase provides invoice management, subscription management, enhanced Stripe integration, billing analytics, and automated billing workflows.

## Development Objectives

### Primary Goals
- ✅ **Invoice Management**: Complete invoice lifecycle management
- ✅ **Subscription Management**: Comprehensive subscription control
- ✅ **Enhanced Stripe Integration**: Advanced Stripe operations and webhooks
- ✅ **Billing Analytics**: Revenue reporting and billing insights
- ✅ **Automated Workflows**: Billing automation and notifications

### Technical Deliverables
- Invoice management system
- Subscription management interface
- Enhanced Stripe integration service
- Billing analytics dashboard
- Automated billing workflows

## User Stories (Development Ready)

### Story 4.1: Invoice Management
**As an** admin user  
**I want to** create, manage, and track invoices for all accounts  
**So that** I can handle billing operations efficiently

**Acceptance Criteria:**
- [ ] Create invoices with line items and custom amounts
- [ ] Invoice status tracking (draft, sent, paid, overdue, void)
- [ ] Integration with Stripe for invoice processing
- [ ] Invoice templates and customization
- [ ] Send invoices via email with tracking

**Technical Requirements:**
- Invoice creation wizard with line item management
- Status workflow with automatic updates
- Stripe invoice integration
- Email delivery system with tracking
- PDF generation for invoices

### Story 4.2: Subscription Management
**As an** admin user  
**I want to** manage recurring subscriptions for accounts  
**So that** I can automate billing and control service access

**Acceptance Criteria:**
- [ ] Create and modify subscription plans
- [ ] Assign subscriptions to accounts
- [ ] Handle subscription lifecycle (active, past_due, canceled)
- [ ] Proration and plan changes
- [ ] Subscription analytics and reporting

**Technical Requirements:**
- Subscription plan management interface
- Stripe subscription integration
- Lifecycle state management
- Proration calculation logic
- Automated status updates from webhooks

### Story 4.3: Enhanced Stripe Integration
**As an** admin user  
**I want to** have comprehensive Stripe integration  
**So that** I can handle all payment scenarios reliably

**Acceptance Criteria:**
- [ ] Customer management in Stripe
- [ ] Payment method management
- [ ] Webhook handling for all billing events
- [ ] Failed payment recovery workflows
- [ ] Refund and credit management

**Technical Requirements:**
- Comprehensive Stripe API integration
- Webhook endpoint with event processing
- Error handling and retry mechanisms
- Payment failure recovery system
- Audit trail for all Stripe operations

### Story 4.4: Billing Analytics and Reporting
**As an** admin user  
**I want to** view comprehensive billing analytics  
**So that** I can understand revenue trends and business metrics

**Acceptance Criteria:**
- [ ] Revenue dashboard with key metrics
- [ ] Subscription analytics (MRR, churn, growth)
- [ ] Invoice aging and collection reports
- [ ] Payment success/failure analytics
- [ ] Export capabilities for financial reporting

**Technical Requirements:**
- Analytics dashboard with real-time data
- Time-series revenue tracking
- Cohort analysis for subscriptions
- Automated report generation
- Integration with accounting systems

### Story 4.5: Automated Billing Workflows
**As an** admin user  
**I want to** automate billing processes and notifications  
**So that** I can reduce manual work and improve customer experience

**Acceptance Criteria:**
- [ ] Automated invoice generation for subscriptions
- [ ] Payment reminder emails for overdue invoices
- [ ] Failed payment retry workflows
- [ ] Subscription renewal notifications
- [ ] Dunning management for delinquent accounts

**Technical Requirements:**
- Background job processing for automation
- Email notification system
- Configurable retry logic
- Escalation workflows
- Customer communication templates

## Technical Implementation

### Database Schema (New Tables)
```sql
-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  stripe_invoice_id VARCHAR UNIQUE,
  invoice_number VARCHAR UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  status VARCHAR NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  line_items JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  stripe_subscription_id VARCHAR UNIQUE,
  stripe_customer_id VARCHAR,
  status VARCHAR NOT NULL,
  plan_name VARCHAR NOT NULL,
  plan_id VARCHAR,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  billing_interval VARCHAR NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  stripe_payment_method_id VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL, -- 'card', 'bank_account', etc.
  is_default BOOLEAN DEFAULT FALSE,
  card_last4 VARCHAR,
  card_brand VARCHAR,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  bank_last4 VARCHAR,
  bank_routing_number VARCHAR,
  status VARCHAR DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing events table (for webhook tracking)
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR UNIQUE NOT NULL,
  event_type VARCHAR NOT NULL,
  account_id UUID REFERENCES accounts(id),
  object_type VARCHAR NOT NULL, -- 'invoice', 'subscription', 'payment', etc.
  object_id VARCHAR NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Constraints and indexes
ALTER TABLE invoices 
ADD CONSTRAINT check_invoice_status 
CHECK (status IN ('draft', 'open', 'paid', 'past_due', 'canceled', 'uncollectible'));

ALTER TABLE subscriptions 
ADD CONSTRAINT check_subscription_status 
CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'));

ALTER TABLE subscriptions 
ADD CONSTRAINT check_billing_interval 
CHECK (billing_interval IN ('month', 'year', 'week', 'day'));

-- Performance indexes
CREATE INDEX idx_invoices_account ON invoices(account_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);

CREATE INDEX idx_subscriptions_account ON subscriptions(account_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_period ON subscriptions(current_period_end);

CREATE INDEX idx_payment_methods_account ON payment_methods(account_id);
CREATE INDEX idx_payment_methods_stripe ON payment_methods(stripe_payment_method_id);

CREATE INDEX idx_billing_events_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_processed ON billing_events(processed);
CREATE INDEX idx_billing_events_created_at ON billing_events(created_at);
```

### Component Architecture
```
src/modules/admin/components/billing/
├── InvoiceTable.tsx              # Invoice listing and management
├── CreateInvoiceModal.tsx        # Invoice creation wizard
├── InvoiceDetailsModal.tsx       # Invoice detail view and actions
├── SubscriptionTable.tsx         # Subscription management
├── CreateSubscriptionModal.tsx   # Subscription creation
├── SubscriptionDetailsModal.tsx  # Subscription detail view
├── PaymentMethodsTable.tsx       # Payment method management
├── BillingAnalytics.tsx          # Revenue and billing analytics
├── BillingEventsLog.tsx          # Webhook event tracking
└── BillingWorkflows.tsx          # Automated workflow management
```

### Service Layer
```typescript
export interface AdminBillingService {
  // Invoice operations
  getInvoices(filters?: InvoiceFilters): Promise<InvoiceListResponse>;
  getInvoice(id: string): Promise<InvoiceDetails>;
  createInvoice(data: CreateInvoiceData): Promise<Invoice>;
  updateInvoice(id: string, data: UpdateInvoiceData): Promise<Invoice>;
  sendInvoice(id: string): Promise<void>;
  voidInvoice(id: string): Promise<Invoice>;
  
  // Subscription operations
  getSubscriptions(filters?: SubscriptionFilters): Promise<SubscriptionListResponse>;
  getSubscription(id: string): Promise<SubscriptionDetails>;
  createSubscription(data: CreateSubscriptionData): Promise<Subscription>;
  updateSubscription(id: string, data: UpdateSubscriptionData): Promise<Subscription>;
  cancelSubscription(id: string, options?: CancelOptions): Promise<Subscription>;
  
  // Stripe integration
  syncWithStripe(objectType: 'invoice' | 'subscription', objectId: string): Promise<SyncResult>;
  handleWebhook(event: StripeWebhookEvent): Promise<void>;
  retryFailedPayment(subscriptionId: string): Promise<PaymentResult>;
  
  // Payment methods
  getPaymentMethods(accountId: string): Promise<PaymentMethod[]>;
  addPaymentMethod(accountId: string, data: PaymentMethodData): Promise<PaymentMethod>;
  setDefaultPaymentMethod(accountId: string, paymentMethodId: string): Promise<void>;
  
  // Analytics
  getBillingMetrics(filters?: MetricsFilters): Promise<BillingMetrics>;
  getRevenueAnalytics(timeRange?: TimeRange): Promise<RevenueAnalytics>;
  getSubscriptionAnalytics(): Promise<SubscriptionAnalytics>;
}
```

### API Endpoints
```typescript
// Invoice management endpoints
GET    /api/admin/invoices                   # List all invoices
POST   /api/admin/invoices                   # Create new invoice
GET    /api/admin/invoices/:id               # Get invoice details
PUT    /api/admin/invoices/:id               # Update invoice
DELETE /api/admin/invoices/:id               # Delete/void invoice
POST   /api/admin/invoices/:id/send          # Send invoice
POST   /api/admin/invoices/:id/void          # Void invoice

// Subscription management endpoints
GET    /api/admin/subscriptions              # List all subscriptions
POST   /api/admin/subscriptions              # Create subscription
GET    /api/admin/subscriptions/:id          # Get subscription details
PUT    /api/admin/subscriptions/:id          # Update subscription
DELETE /api/admin/subscriptions/:id          # Cancel subscription
POST   /api/admin/subscriptions/:id/retry    # Retry failed payment

// Payment method endpoints
GET    /api/admin/accounts/:id/payment-methods  # Get payment methods
POST   /api/admin/accounts/:id/payment-methods  # Add payment method
PUT    /api/admin/payment-methods/:id           # Update payment method
DELETE /api/admin/payment-methods/:id           # Remove payment method

// Stripe integration endpoints
POST   /api/admin/billing/sync                  # Sync with Stripe
POST   /api/admin/billing/webhook               # Stripe webhook handler
GET    /api/admin/billing/events                # Billing event log

// Analytics endpoints
GET    /api/admin/billing/metrics               # Billing metrics
GET    /api/admin/billing/revenue-analytics     # Revenue analytics
GET    /api/admin/billing/subscription-analytics # Subscription analytics
```

## Enhanced Stripe Integration

### Stripe Service Implementation
```typescript
export class StripeIntegrationService {
  
  // Customer management
  async createStripeCustomer(account: AdminAccount): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      name: account.name,
      email: account.email,
      metadata: {
        account_id: account.id,
        account_type: account.type
      }
    });
    
    await this.logBillingEvent('customer.created', account.id, 'customer', customer.id);
    return customer;
  }
  
  // Invoice management
  async createStripeInvoice(invoiceData: CreateInvoiceData): Promise<Stripe.Invoice> {
    const invoice = await stripe.invoices.create({
      customer: invoiceData.stripe_customer_id,
      collection_method: 'send_invoice',
      days_until_due: 30,
      metadata: {
        account_id: invoiceData.account_id,
        internal_invoice_id: invoiceData.id
      }
    });
    
    // Add line items
    for (const lineItem of invoiceData.line_items) {
      await stripe.invoiceItems.create({
        customer: invoiceData.stripe_customer_id,
        invoice: invoice.id,
        amount: lineItem.amount_cents,
        currency: lineItem.currency || 'usd',
        description: lineItem.description
      });
    }
    
    await this.logBillingEvent('invoice.created', invoiceData.account_id, 'invoice', invoice.id);
    return invoice;
  }
  
  // Subscription management
  async createStripeSubscription(subscriptionData: CreateSubscriptionData): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.create({
      customer: subscriptionData.stripe_customer_id,
      items: [{
        price: subscriptionData.stripe_price_id
      }],
      trial_period_days: subscriptionData.trial_days,
      metadata: {
        account_id: subscriptionData.account_id,
        internal_subscription_id: subscriptionData.id
      }
    });
    
    await this.logBillingEvent('subscription.created', subscriptionData.account_id, 'subscription', subscription.id);
    return subscription;
  }
  
  // Webhook handling
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const eventRecord = await this.recordBillingEvent(event);
    
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        // ... additional webhook handlers
      }
      
      await this.markEventProcessed(eventRecord.id);
    } catch (error) {
      await this.markEventError(eventRecord.id, error.message);
      throw error;
    }
  }
}
```

### Webhook Event Processing
```typescript
// Stripe webhook endpoint implementation
export async function handleStripeWebhook(request: Request): Promise<Response> {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return new Response('Invalid signature', { status: 400 });
  }
  
  try {
    await stripeIntegrationService.handleWebhookEvent(event);
    return new Response('Event processed', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Processing error', { status: 500 });
  }
}
```

## Testing Requirements

### Unit Tests
- [ ] Invoice service operations
- [ ] Subscription lifecycle management
- [ ] Stripe integration functions
- [ ] Webhook event processing
- [ ] Billing analytics calculations

### Integration Tests
- [ ] End-to-end invoice workflow
- [ ] Subscription creation and management
- [ ] Stripe webhook integration
- [ ] Payment failure recovery
- [ ] Billing analytics accuracy

### Performance Tests
- [ ] Large invoice listing performance
- [ ] Bulk subscription operations
- [ ] Webhook processing under load
- [ ] Analytics query optimization

## Security Considerations

### Access Control
```sql
-- RLS policies for billing tables
CREATE POLICY "Admins can manage all invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = auth.uid() AND a.type = 'admin'
    )
  );

CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (
    account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid())
  );

-- Similar policies for subscriptions and payment methods
```

### Data Protection
- Stripe data handling compliance
- PCI DSS considerations for payment data
- Secure webhook signature validation
- Encrypted storage of sensitive billing data

## Performance Requirements

### Optimization Strategies
- **Invoice Listing**: Indexed queries with pagination
- **Stripe API**: Rate limiting and caching
- **Analytics**: Pre-computed metrics and aggregations
- **Webhooks**: Async processing with queues

### Billing Data Management
- Efficient invoice and subscription queries
- Optimized analytics calculations
- Partitioned event logs for scalability
- Archived billing data for historical reporting

## Deployment Checklist

### Pre-Deployment
- [ ] Database billing tables created
- [ ] Stripe integration tested
- [ ] Webhook endpoints configured
- [ ] Billing workflows validated
- [ ] Analytics accuracy verified

### Deployment Steps
1. Create billing database tables
2. Deploy enhanced Stripe integration
3. Configure webhook endpoints
4. Deploy billing management components
5. Verify billing functionality
6. Test automated workflows

### Post-Deployment Validation
- [ ] Invoice creation and management working
- [ ] Subscription lifecycle functioning
- [ ] Stripe integration operating correctly
- [ ] Webhooks processing events
- [ ] Billing analytics displaying accurately
- [ ] Automated workflows executing properly

## Integration with Previous Phases

### Cross-Phase Dependencies
- **Phase 1 (Accounts)**: Billing tied to account management
- **Phase 2 (Tools)**: Subscription-based tool access
- **Phase 3 (Profiles)**: User-specific billing notifications

### Complete Data Flow
```
Account Creation (Phase 1)
    ↓
Tool Assignment (Phase 2)
    ↓
Profile Management (Phase 3)
    ↓
Billing and Subscriptions (Phase 4)
    ↓
Complete Admin Platform
```

## Developer Handoff

### Implementation Priority
1. **Database Setup**: Create billing tables and relationships
2. **Stripe Integration**: Enhanced Stripe service with webhooks
3. **Invoice Management**: Complete invoice lifecycle
4. **Subscription System**: Recurring billing management
5. **Analytics Dashboard**: Billing insights and reporting
6. **Automated Workflows**: Billing automation

### Key Integration Points
- **Account System**: Billing tied to account management
- **Stripe Service**: Enhanced existing Stripe integration
- **Activity Logging**: Billing operations in audit trail
- **Tool Access**: Subscription-based tool assignments

### Critical Success Factors
- Reliable Stripe integration with comprehensive webhook handling
- Accurate billing calculations and invoice management
- Robust subscription lifecycle management
- Comprehensive billing analytics and reporting
- Seamless integration with all previous phases

---

**Phase 4 Complete**: Billing integration completes the Epic 3 Admin Platform with comprehensive billing management, Stripe integration, and analytics, providing a complete administrative solution for the Battle Born Capital Advisors platform.