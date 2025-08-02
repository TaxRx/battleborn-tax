// Epic 3: Admin Service Error Handler
// File: error-handler.ts
// Purpose: Comprehensive error handling and response formatting for account operations
// Story: 1.2 - Account CRUD Operations

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: string[];
  warnings?: string[];
  timestamp: string;
  request_id?: string;
}

export interface ErrorContext {
  operation: string;
  resource: string;
  user_id?: string;
  account_id?: string;
  request_path?: string;
  method?: string;
}

/**
 * Standardized error response creator
 */
export function createErrorResponse(
  error: string,
  context: ErrorContext,
  status: number = 500,
  details?: string[],
  warnings?: string[]
): Response {
  const errorResponse: ErrorResponse = {
    error,
    details,
    warnings,
    timestamp: new Date().toISOString(),
    request_id: generateRequestId()
  };

  // Log error for monitoring
  console.error('Admin Service Error:', {
    ...errorResponse,
    context,
    status
  });

  return new Response(
    JSON.stringify(errorResponse),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    }
  );
}

/**
 * Handle Supabase database errors with context
 */
export function handleDatabaseError(
  error: any,
  context: ErrorContext,
  corsHeaders: Record<string, string>
): Response {
  console.error('Database error:', error, 'Context:', context);

  // Common Supabase error codes
  switch (error.code) {
    case 'PGRST116':
      return new Response(
        JSON.stringify({
          error: `${context.resource} not found`,
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    case '23505':
      return new Response(
        JSON.stringify({
          error: `${context.resource} already exists`,
          code: 'DUPLICATE_RESOURCE',
          details: ['A resource with these unique constraints already exists'],
          timestamp: new Date().toISOString()
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    case '23503':
      return new Response(
        JSON.stringify({
          error: 'Foreign key constraint violation',
          code: 'CONSTRAINT_VIOLATION',
          details: ['Referenced resource does not exist'],
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    case '23514':
      return new Response(
        JSON.stringify({
          error: 'Data validation failed',
          code: 'CHECK_CONSTRAINT_VIOLATION',
          details: ['Data does not meet database constraints'],
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    case '42501':
      return new Response(
        JSON.stringify({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          details: ['User does not have required permissions for this operation'],
          timestamp: new Date().toISOString()
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    default:
      return new Response(
        JSON.stringify({
          error: `Failed to ${context.operation} ${context.resource}`,
          code: 'DATABASE_ERROR',
          details: [error.message || 'Unknown database error'],
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
  }
}

/**
 * Handle validation errors with detailed feedback
 */
export function handleValidationError(
  validationResult: { errors: string[]; warnings?: string[] },
  context: ErrorContext,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: `Validation failed for ${context.operation} ${context.resource}`,
      code: 'VALIDATION_ERROR',
      details: validationResult.errors,
      warnings: validationResult.warnings,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Handle rate limiting errors
 */
export function handleRateLimitError(
  operation: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      details: [`Too many ${operation} requests. Please try again later.`],
      timestamp: new Date().toISOString(),
      retry_after: 60 // seconds
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': '60'
      } 
    }
  );
}

/**
 * Handle authentication and authorization errors
 */
export function handleAuthError(
  reason: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Authentication required',
      code: 'AUTH_ERROR',
      details: [reason],
      timestamp: new Date().toISOString()
    }),
    { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Handle permission denied errors
 */
export function handlePermissionError(
  resource: string,
  operation: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Insufficient permissions',
      code: 'PERMISSION_DENIED',
      details: [`Admin access required to ${operation} ${resource}`],
      timestamp: new Date().toISOString()
    }),
    { 
      status: 403, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Handle resource not found errors
 */
export function handleNotFoundError(
  resource: string,
  resourceId: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: `${resource} not found`,
      code: 'NOT_FOUND',
      details: [`${resource} with ID '${resourceId}' does not exist`],
      timestamp: new Date().toISOString()
    }),
    { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Handle conflict errors (resource already exists, dependencies exist, etc.)
 */
export function handleConflictError(
  message: string,
  details: string[],
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      code: 'CONFLICT',
      details,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 409, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Handle generic server errors with context
 */
export function handleServerError(
  error: Error,
  context: ErrorContext,
  corsHeaders: Record<string, string>
): Response {
  console.error('Server error:', error, 'Context:', context);

  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: ['An unexpected error occurred while processing your request'],
      timestamp: new Date().toISOString(),
      request_id: generateRequestId()
    }),
    { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Wrap async operations with comprehensive error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  corsHeaders: Record<string, string>
): Promise<T | Response> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      return handleServerError(error, context, corsHeaders);
    }
    
    // Handle Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error, context, corsHeaders);
    }

    // Generic error handling
    console.error('Unexpected error type:', error, 'Context:', context);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Generate unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if response is an error response
 */
export function isErrorResponse(response: any): response is Response {
  return response instanceof Response && response.status >= 400;
}