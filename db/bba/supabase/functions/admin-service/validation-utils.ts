// Epic 3: Admin Service Validation Utilities
// File: validation-utils.ts
// Purpose: Comprehensive validation and data integrity checks for account operations
// Story: 1.2 - Account CRUD Operations

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AccountValidationContext {
  isUpdate?: boolean;
  existingAccount?: any;
  checkUniqueness?: boolean;
  supabase?: any;
}

/**
 * Comprehensive account data validation
 */
export function validateAccountData(
  data: any, 
  context: AccountValidationContext = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!context.isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Account name is required');
    } else if (data.name.trim().length > 255) {
      errors.push('Account name must be 255 characters or less');
    } else if (data.name.trim().length < 2) {
      errors.push('Account name must be at least 2 characters long');
    }
  }

  if (!context.isUpdate || data.type !== undefined) {
    if (!data.type || typeof data.type !== 'string') {
      errors.push('Account type is required');
    } else if (!isValidAccountType(data.type)) {
      errors.push('Invalid account type. Must be one of: admin, platform, affiliate, client, expert');
    }
  }

  // Optional field validation
  if (data.address !== undefined && data.address !== null) {
    if (typeof data.address !== 'string') {
      errors.push('Address must be a string');
    } else if (data.address.length > 1000) {
      errors.push('Address must be 1000 characters or less');
    }
  }

  if (data.website_url !== undefined && data.website_url !== null) {
    if (typeof data.website_url !== 'string') {
      errors.push('Website URL must be a string');
    } else if (data.website_url.trim().length > 0 && !isValidUrl(data.website_url)) {
      errors.push('Invalid website URL format');
    }
  }

  if (data.logo_url !== undefined && data.logo_url !== null) {
    if (typeof data.logo_url !== 'string') {
      errors.push('Logo URL must be a string');
    } else if (data.logo_url.trim().length > 0 && !isValidUrl(data.logo_url)) {
      errors.push('Invalid logo URL format');
    } else if (data.logo_url.trim().length > 0 && !isImageUrl(data.logo_url)) {
      warnings.push('Logo URL should point to an image file');
    }
  }

  if (data.stripe_customer_id !== undefined && data.stripe_customer_id !== null) {
    if (typeof data.stripe_customer_id !== 'string') {
      errors.push('Stripe customer ID must be a string');
    } else if (data.stripe_customer_id.trim().length > 0 && !isValidStripeCustomerId(data.stripe_customer_id)) {
      errors.push('Invalid Stripe customer ID format');
    }
  }

  // Business logic validation
  if (data.type === 'admin' && context.isUpdate && context.existingAccount?.type !== 'admin') {
    warnings.push('Converting account to admin type requires careful consideration');
  }

  if (data.type !== 'platform' && data.stripe_customer_id) {
    warnings.push('Stripe customer ID is typically only needed for platform accounts');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate account type transitions
 */
export function validateAccountTypeTransition(
  fromType: string, 
  toType: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Admin accounts cannot be converted to other types
  if (fromType === 'admin' && toType !== 'admin') {
    errors.push('Admin accounts cannot be converted to other types');
  }

  // Platform accounts with active integrations should be handled carefully
  if (fromType === 'platform' && toType !== 'platform') {
    warnings.push('Converting platform accounts may affect active integrations and tool access');
  }

  // Affiliate to client conversion considerations
  if (fromType === 'affiliate' && toType === 'client') {
    warnings.push('Converting affiliate to client will remove commission capabilities');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate account deletion safety
 */
export async function validateAccountDeletion(
  accountId: string, 
  supabase: any
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      errors.push('Account not found');
      return { isValid: false, errors };
    }

    // Check account type restrictions
    if (account.type === 'admin') {
      errors.push('Admin accounts cannot be deleted');
    }

    // Check for active profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('account_id', accountId);

    if (profilesError) {
      errors.push('Failed to check account dependencies');
    } else if (profiles && profiles.length > 0) {
      errors.push(`Account has ${profiles.length} active profile(s) that must be removed first`);
    }

    // Check for active tool access
    const { data: toolAccess, error: toolError } = await supabase
      .from('account_tool_access')
      .select('tool_id, access_level')
      .eq('account_id', accountId)
      .neq('access_level', 'none');

    if (toolError) {
      warnings.push('Could not verify tool access permissions');
    } else if (toolAccess && toolAccess.length > 0) {
      warnings.push(`Account has ${toolAccess.length} active tool access permission(s)`);
    }

    // Check for financial dependencies
    if (account.stripe_customer_id) {
      warnings.push('Account has Stripe integration - consider handling billing before deletion');
    }

    // Check for client relationships (if this is an affiliate)
    if (account.type === 'affiliate') {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('primary_affiliate_id', accountId);

      if (clientsError) {
        warnings.push('Could not verify client relationships');
      } else if (clients && clients.length > 0) {
        warnings.push(`${clients.length} client(s) are assigned to this affiliate`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    console.error('Error validating account deletion:', error);
    return {
      isValid: false,
      errors: ['Failed to validate account deletion safety']
    };
  }
}

/**
 * Validate request rate limiting and prevent abuse
 */
export function validateRequestRate(
  operation: string,
  accountId: string,
  requestCache: Map<string, number[]>
): ValidationResult {
  const errors: string[] = [];
  const now = Date.now();
  const key = `${operation}:${accountId}`;
  
  // Rate limits (requests per minute)
  const rateLimits = {
    create: 10,    // 10 account creations per minute
    update: 30,    // 30 updates per minute
    delete: 5,     // 5 deletions per minute
    list: 100      // 100 list operations per minute
  };

  const limit = rateLimits[operation as keyof typeof rateLimits] || 60;
  
  // Clean old requests (older than 1 minute)
  const currentRequests = requestCache.get(key) || [];
  const recentRequests = currentRequests.filter(timestamp => now - timestamp < 60000);
  
  if (recentRequests.length >= limit) {
    errors.push(`Rate limit exceeded for ${operation} operation. Maximum ${limit} requests per minute.`);
  }
  
  // Update cache
  recentRequests.push(now);
  requestCache.set(key, recentRequests);
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper Functions

export function isValidAccountType(type: string): boolean {
  return ['admin', 'platform', 'affiliate', 'client', 'expert'].includes(type);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return imageExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

export function isValidStripeCustomerId(customerId: string): boolean {
  // Stripe customer IDs start with 'cus_' followed by 24 characters
  return /^cus_[a-zA-Z0-9]{24}$/.test(customerId);
}

export function sanitizeStringInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
    .substring(0, 1000); // Prevent excessively long strings
}

export function validatePaginationParams(page?: string, limit?: string): { page: number; limit: number; errors: string[] } {
  const errors: string[] = [];
  let validPage = 1;
  let validLimit = 50;

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    } else if (pageNum > 10000) {
      errors.push('Page number too large (max: 10000)');
    } else {
      validPage = pageNum;
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('Limit too large (max: 100)');
    } else {
      validLimit = limitNum;
    }
  }

  return { page: validPage, limit: validLimit, errors };
}

export function validateSortParams(sortBy?: string, sortOrder?: string): { sortBy: string; sortOrder: string; errors: string[] } {
  const errors: string[] = [];
  const allowedSortFields = ['name', 'type', 'created_at', 'updated_at'];
  const allowedSortOrders = ['asc', 'desc'];

  let validSortBy = 'created_at';
  let validSortOrder = 'desc';

  if (sortBy !== undefined) {
    if (!allowedSortFields.includes(sortBy)) {
      errors.push(`Invalid sort field. Allowed: ${allowedSortFields.join(', ')}`);
    } else {
      validSortBy = sortBy;
    }
  }

  if (sortOrder !== undefined) {
    if (!allowedSortOrders.includes(sortOrder)) {
      errors.push(`Invalid sort order. Allowed: ${allowedSortOrders.join(', ')}`);
    } else {
      validSortOrder = sortOrder;
    }
  }

  return { sortBy: validSortBy, sortOrder: validSortOrder, errors };
}