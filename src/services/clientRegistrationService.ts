import { supabase } from '../lib/supabase';

export interface ClientRegistrationData {
  // Business Information
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  taxId: string;
  businessType: string;
  
  // Owner Information
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  
  // Optional fields
  invitationToken?: string;
  affiliateId?: string;
}

export interface ClientRegistrationResponse {
  success: boolean;
  clientId?: string;
  userId?: string;
  error?: string;
  details?: string[];
}

export interface BusinessValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ClientRegistrationService {
  /**
   * Register a new client with business verification
   */
  static async registerClient(data: ClientRegistrationData): Promise<ClientRegistrationResponse> {
    try {
      // Call the client registration Edge Function
      const { data: response, error } = await supabase.functions.invoke('client-registration', {
        body: data
      });

      if (error) {
        console.error('Registration API error:', error);
        return {
          success: false,
          error: error.message || 'Registration failed. Please try again.'
        };
      }

      if (response?.error) {
        console.error('Registration business logic error:', response.error);
        return {
          success: false,
          error: response.error,
          details: response.details
        };
      }

      return {
        success: true,
        clientId: response.clientId,
        userId: response.userId
      };

    } catch (error) {
      console.error('Registration service error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Validate business information before registration
   */
  static validateBusinessInfo(data: Partial<ClientRegistrationData>): BusinessValidationResult {
    const errors: string[] = [];

    // Required business fields
    if (!data.businessName?.trim()) {
      errors.push('Business name is required');
    }

    if (!data.businessEmail?.trim()) {
      errors.push('Business email is required');
    } else if (!/\S+@\S+\.\S+/.test(data.businessEmail)) {
      errors.push('Please enter a valid business email address');
    }

    if (!data.businessPhone?.trim()) {
      errors.push('Business phone number is required');
    } else if (!/^[\d\s\-\(\)]+$/.test(data.businessPhone)) {
      errors.push('Please enter a valid phone number');
    }

    if (!data.businessAddress?.trim()) {
      errors.push('Business address is required');
    }

    if (!data.taxId?.trim()) {
      errors.push('Tax ID (EIN) is required');
    } else if (!/^\d{2}-\d{7}$/.test(data.taxId)) {
      errors.push('Tax ID must be in format XX-XXXXXXX (EIN)');
    }

    if (!data.businessType?.trim()) {
      errors.push('Business type is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate owner information before registration
   */
  static validateOwnerInfo(data: Partial<ClientRegistrationData>): BusinessValidationResult {
    const errors: string[] = [];

    // Required owner fields
    if (!data.ownerFirstName?.trim()) {
      errors.push('Owner first name is required');
    }

    if (!data.ownerLastName?.trim()) {
      errors.push('Owner last name is required');
    }

    if (!data.ownerEmail?.trim()) {
      errors.push('Owner email is required');
    } else if (!/\S+@\S+\.\S+/.test(data.ownerEmail)) {
      errors.push('Please enter a valid email address');
    }

    if (!data.ownerPhone?.trim()) {
      errors.push('Owner phone number is required');
    } else if (!/^[\d\s\-\(\)]+$/.test(data.ownerPhone)) {
      errors.push('Please enter a valid phone number');
    }

    if (!data.password?.trim()) {
      errors.push('Password is required');
    } else if (data.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a business is already registered
   */
  static async checkBusinessExists(taxId: string, businessEmail: string): Promise<{
    exists: boolean;
    field?: 'taxId' | 'email';
    message?: string;
  }> {
    try {
      // Check Tax ID
      const { data: taxIdCheck, error: taxIdError } = await supabase
        .from('clients')
        .select('id, business_name')
        .eq('tax_id', taxId)
        .single();

      if (taxIdError && taxIdError.code !== 'PGRST116') {
        console.error('Error checking Tax ID:', taxIdError);
        throw new Error('Unable to verify business registration');
      }

      if (taxIdCheck) {
        return {
          exists: true,
          field: 'taxId',
          message: `Business with Tax ID ${taxId} is already registered`
        };
      }

      // Check business email
      const { data: emailCheck, error: emailError } = await supabase
        .from('clients')
        .select('id, business_name')
        .eq('business_email', businessEmail)
        .single();

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error checking business email:', emailError);
        throw new Error('Unable to verify business email');
      }

      if (emailCheck) {
        return {
          exists: true,
          field: 'email',
          message: `Business email ${businessEmail} is already registered`
        };
      }

      return { exists: false };

    } catch (error) {
      console.error('Business existence check error:', error);
      throw error;
    }
  }

  /**
   * Verify invitation token
   */
  static async verifyInvitationToken(token: string): Promise<{
    valid: boolean;
    affiliateId?: string;
    message?: string;
  }> {
    try {
      const { data: invitation, error } = await supabase
        .from('client_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error || !invitation) {
        return {
          valid: false,
          message: 'Invalid or expired invitation token'
        };
      }

      // Check if invitation is not expired
      const expiresAt = new Date(invitation.expires_at);
      if (expiresAt < new Date()) {
        return {
          valid: false,
          message: 'Invitation token has expired'
        };
      }

      return {
        valid: true,
        affiliateId: invitation.affiliate_id
      };

    } catch (error) {
      console.error('Invitation verification error:', error);
      return {
        valid: false,
        message: 'Unable to verify invitation token'
      };
    }
  }

  /**
   * Get client registration status
   */
  static async getRegistrationStatus(clientId: string): Promise<{
    status: 'pending_verification' | 'verified' | 'active' | 'suspended';
    emailVerified: boolean;
    profileComplete: boolean;
  }> {
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .select(`
          status,
          business_name,
          business_email,
          profiles!client_users(
            id,
            email_verified,
            first_name,
            last_name
          )
        `)
        .eq('id', clientId)
        .single();

      if (error) {
        throw error;
      }

      const profile = client.profiles?.[0];
      
      return {
        status: client.status,
        emailVerified: profile?.email_verified || false,
        profileComplete: !!(profile?.first_name && profile?.last_name)
      };

    } catch (error) {
      console.error('Registration status check error:', error);
      throw new Error('Unable to check registration status');
    }
  }


  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }

  /**
   * Format Tax ID for display
   */
  static formatTaxId(taxId: string): string {
    const digits = taxId.replace(/\D/g, '');
    if (digits.length === 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return taxId;
  }

  /**
   * Get business types list
   */
  static getBusinessTypes(): string[] {
    return [
      'LLC',
      'Corporation',
      'S-Corporation',
      'Partnership',
      'Sole Proprietorship',
      'Non-Profit',
      'Other'
    ];
  }
} 