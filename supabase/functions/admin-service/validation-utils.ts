// Epic 3: Admin Service Validation Utilities
// File: validation-utils.ts
// Purpose: Comprehensive validation and data integrity checks for account and profile operations
// Story: 1.2 - Account CRUD Operations, 3.1 - Profile Management CRUD Operations

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
      errors.push('Invalid account type. Must be one of: admin, operator, affiliate, client, expert');
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

  if (data.type !== 'operator' && data.stripe_customer_id) {
    warnings.push('Stripe customer ID is typically only needed for operator accounts');
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

  // Operator accounts with active integrations should be handled carefully
  if (fromType === 'operator' && toType !== 'operator') {
    warnings.push('Converting operator accounts may affect active integrations and tool access');
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
  return ['admin', 'operator', 'affiliate', 'client', 'expert'].includes(type);
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

// ========= PROFILE VALIDATION FUNCTIONS =========

export interface ProfileValidationContext {
  isUpdate?: boolean;
  existingProfile?: any;
  checkUniqueness?: boolean;
  supabase?: any;
}

/**
 * Comprehensive profile data validation
 */
export function validateProfileData(
  data: any, 
  context: ProfileValidationContext = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation for creation
  if (!context.isUpdate) {
    if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!isValidEmail(data.email)) {
      errors.push('Invalid email format');
    } else if (data.email.length > 254) {
      errors.push('Email must be 254 characters or less');
    }

    if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim().length === 0) {
      errors.push('Full name is required');
    } else if (data.full_name.trim().length > 255) {
      errors.push('Full name must be 255 characters or less');
    } else if (data.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    if (!data.role || typeof data.role !== 'string') {
      errors.push('Role is required');
    } else if (!isValidProfileRole(data.role)) {
      errors.push('Invalid role. Must be either "admin" or "affiliate"');
    }
  }

  // Field validation for updates or when provided
  if (data.email !== undefined) {
    if (typeof data.email !== 'string' || data.email.trim().length === 0) {
      errors.push('Email cannot be empty');
    } else if (!isValidEmail(data.email)) {
      errors.push('Invalid email format');
    } else if (data.email.length > 254) {
      errors.push('Email must be 254 characters or less');
    }
  }

  if (data.full_name !== undefined) {
    if (typeof data.full_name !== 'string' || data.full_name.trim().length === 0) {
      errors.push('Full name cannot be empty');
    } else if (data.full_name.trim().length > 255) {
      errors.push('Full name must be 255 characters or less');
    } else if (data.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }
  }

  if (data.role !== undefined) {
    if (!isValidProfileRole(data.role)) {
      errors.push('Invalid role. Must be either "admin" or "affiliate"');
    }
  }

  if (data.status !== undefined) {
    if (!isValidProfileStatus(data.status)) {
      errors.push('Invalid status. Must be one of: active, inactive, suspended, pending, locked');
    }
  }

  if (data.phone !== undefined && data.phone !== null) {
    if (typeof data.phone !== 'string') {
      errors.push('Phone must be a string');
    } else if (data.phone.length > 0 && !isValidPhoneNumber(data.phone)) {
      warnings.push('Phone number format may not be valid');
    } else if (data.phone.length > 20) {
      errors.push('Phone number must be 20 characters or less');
    }
  }

  if (data.timezone !== undefined && data.timezone !== null) {
    if (typeof data.timezone !== 'string') {
      errors.push('Timezone must be a string');
    } else if (data.timezone.length > 50) {
      errors.push('Timezone must be 50 characters or less');
    } else if (!isValidTimezone(data.timezone)) {
      warnings.push('Timezone may not be a valid timezone identifier');
    }
  }

  if (data.admin_notes !== undefined && data.admin_notes !== null) {
    if (typeof data.admin_notes !== 'string') {
      errors.push('Admin notes must be a string');
    } else if (data.admin_notes.length > 2000) {
      errors.push('Admin notes must be 2000 characters or less');
    }
  }

  if (data.account_id !== undefined && data.account_id !== null) {
    if (!isValidUUID(data.account_id)) {
      errors.push('Account ID must be a valid UUID');
    }
  }

  if (data.metadata !== undefined && data.metadata !== null) {
    if (typeof data.metadata !== 'object' || Array.isArray(data.metadata)) {
      errors.push('Metadata must be an object');
    }
  }

  if (data.preferences !== undefined && data.preferences !== null) {
    if (typeof data.preferences !== 'object' || Array.isArray(data.preferences)) {
      errors.push('Preferences must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate profile update data
 */
export function validateProfileUpdate(
  data: any,
  existingProfile: any
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic data validation
  const basicValidation = validateProfileData(data, { 
    isUpdate: true, 
    existingProfile 
  });
  
  errors.push(...basicValidation.errors);
  if (basicValidation.warnings) {
    warnings.push(...basicValidation.warnings);
  }

  // Check for critical status changes
  if (data.status !== undefined && existingProfile.status !== data.status) {
    if (existingProfile.role === 'admin' && data.status === 'suspended') {
      warnings.push('Suspending an admin profile may affect system administration');
    }
    
    if (existingProfile.status === 'locked' && data.status === 'active') {
      warnings.push('Activating a previously locked profile - ensure security review is complete');
    }
  }

  // Check for role changes
  if (data.role !== undefined && existingProfile.role !== data.role) {
    if (existingProfile.role === 'admin' && data.role === 'affiliate') {
      warnings.push('Changing admin to affiliate will remove administrative privileges');
    }
    
    if (existingProfile.role === 'affiliate' && data.role === 'admin') {
      warnings.push('Changing affiliate to admin will grant administrative privileges');
    }
  }

  // Check for email changes
  if (data.email !== undefined && existingProfile.email !== data.email) {
    warnings.push('Email change may require re-verification and auth sync');
    
    if (data.is_verified === undefined || data.is_verified === true) {
      warnings.push('Consider setting is_verified to false when changing email');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate bulk profile operation
 */
export function validateBulkProfileOperation(
  operation: any
): ValidationResult {
  const errors: string[] = [];

  if (!operation || typeof operation !== 'object') {
    errors.push('Bulk operation data is required');
    return { isValid: false, errors };
  }

  if (!operation.profileIds || !Array.isArray(operation.profileIds)) {
    errors.push('Profile IDs array is required');
  } else {
    if (operation.profileIds.length === 0) {
      errors.push('At least one profile ID is required');
    } else if (operation.profileIds.length > 100) {
      errors.push('Maximum 100 profiles can be processed in a single bulk operation');
    }

    // Validate each profile ID
    for (const profileId of operation.profileIds) {
      if (!isValidUUID(profileId)) {
        errors.push(`Invalid profile ID: ${profileId}`);
        break; // Stop after first invalid ID to avoid spam
      }
    }
  }

  if (!operation.operation || typeof operation.operation !== 'string') {
    errors.push('Operation type is required');
  } else {
    const validOperations = [
      'update_status', 'assign_role', 'remove_role', 
      'sync_auth', 'reset_password', 'verify_email'
    ];
    
    if (!validOperations.includes(operation.operation)) {
      errors.push(`Invalid operation. Must be one of: ${validOperations.join(', ')}`);
    }
  }

  // Validate operation-specific data
  if (operation.operation === 'update_status') {
    if (!operation.data || !operation.data.status) {
      errors.push('Status is required for update_status operation');
    } else if (!isValidProfileStatus(operation.data.status)) {
      errors.push('Invalid status value');
    }
  }

  if (operation.operation === 'assign_role') {
    if (!operation.data || !operation.data.role_name) {
      errors.push('Role name is required for assign_role operation');
    }
  }

  if (operation.operation === 'remove_role') {
    if (!operation.data || !operation.data.roleId) {
      errors.push('Role ID is required for remove_role operation');
    } else if (!isValidUUID(operation.data.roleId)) {
      errors.push('Invalid role ID format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to validate profile role
 */
function isValidProfileRole(role: string): boolean {
  const validRoles = ['admin', 'affiliate'];
  return validRoles.includes(role);
}

/**
 * Helper function to validate profile status
 */
function isValidProfileStatus(status: string): boolean {
  const validStatuses = ['active', 'inactive', 'suspended', 'pending', 'locked'];
  return validStatuses.includes(status);
}

/**
 * Helper function to validate phone number (basic validation)
 */
function isValidPhoneNumber(phone: string): boolean {
  // Basic phone validation - digits, spaces, hyphens, parentheses, plus sign
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{8,20}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Helper function to validate timezone
 */
function isValidTimezone(timezone: string): boolean {
  // Basic timezone validation - common timezone formats
  const timezoneRegex = /^[A-Za-z][A-Za-z\/\_\-\+0-9]*$/;
  return timezoneRegex.test(timezone) && timezone.length <= 50;
}