import { supabase } from '../lib/supabase';
import { validatePasswordStrength } from '../components/PasswordStrengthMeter';

export interface PasswordResetRequest {
  email: string;
  timestamp: number;
  attempts: number;
}

export interface PasswordChangeNotification {
  userId: string;
  email: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
}

class PasswordService {
  private resetAttempts: Map<string, PasswordResetRequest> = new Map();
  private readonly MAX_RESET_ATTEMPTS = 5;
  private readonly RESET_COOLDOWN = 15 * 60 * 1000; // 15 minutes

  /**
   * Request password reset with rate limiting
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string; cooldownRemaining?: number }> {
    try {
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit(email);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Too many password reset attempts. Please try again in ${Math.ceil(rateLimitCheck.cooldownRemaining! / 60000)} minutes.`,
          cooldownRemaining: rateLimitCheck.cooldownRemaining
        };
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Track the reset attempt
      this.trackResetAttempt(email);

      // Log security event
      await this.logSecurityEvent('password_reset_requested', { email });

      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: 'Failed to send password reset email' };
    }
  }

  /**
   * Update password with validation and security checks
   */
  async updatePassword(newPassword: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate password strength
      const { isValid, failedRequirements } = validatePasswordStrength(newPassword);
      if (!isValid) {
        return {
          success: false,
          error: `Password does not meet requirements: ${failedRequirements.join(', ')}`
        };
      }

      // Check if password is in common passwords list (basic check)
      if (this.isCommonPassword(newPassword)) {
        return {
          success: false,
          error: 'This password is too common. Please choose a more unique password.'
        };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get current user for notification
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Send security notification
        await this.sendPasswordChangeNotification({
          userId: user.id,
          email: user.email!,
          timestamp: Date.now(),
          ipAddress: await this.getClientIP(),
          userAgent: navigator.userAgent
        });

        // Log security event
        await this.logSecurityEvent('password_changed', { userId: user.id, email: user.email });
      }

      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: 'Failed to update password' };
    }
  }

  /**
   * Check if user can request password reset (rate limiting)
   */
  private checkRateLimit(email: string): { allowed: boolean; cooldownRemaining?: number } {
    const attempt = this.resetAttempts.get(email);
    
    if (!attempt) {
      return { allowed: true };
    }

    const now = Date.now();
    const timeSinceLastAttempt = now - attempt.timestamp;

    // Reset attempts if cooldown period has passed
    if (timeSinceLastAttempt > this.RESET_COOLDOWN) {
      this.resetAttempts.delete(email);
      return { allowed: true };
    }

    // Check if max attempts reached
    if (attempt.attempts >= this.MAX_RESET_ATTEMPTS) {
      return { 
        allowed: false, 
        cooldownRemaining: this.RESET_COOLDOWN - timeSinceLastAttempt 
      };
    }

    return { allowed: true };
  }

  /**
   * Track password reset attempt
   */
  private trackResetAttempt(email: string): void {
    const existing = this.resetAttempts.get(email);
    
    if (existing) {
      existing.attempts += 1;
      existing.timestamp = Date.now();
    } else {
      this.resetAttempts.set(email, {
        email,
        timestamp: Date.now(),
        attempts: 1
      });
    }
  }

  /**
   * Basic check for common passwords
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', 'password123', '123456', '123456789', 'qwerty',
      'abc123', 'password1', 'admin', 'letmein', 'welcome',
      'monkey', '1234567890', 'password12', 'qwerty123'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Send password change notification
   */
  private async sendPasswordChangeNotification(notification: PasswordChangeNotification): Promise<void> {
    try {
      // In a real app, this would send an email notification
      // For now, we'll just log it
      console.log('Password change notification:', {
        email: notification.email,
        timestamp: new Date(notification.timestamp).toISOString(),
        ipAddress: notification.ipAddress,
        userAgent: notification.userAgent
      });

      // You could also store this in a notifications table
      // await supabase.from('security_notifications').insert({
      //   user_id: notification.userId,
      //   type: 'password_changed',
      //   message: 'Your password was changed',
      //   metadata: {
      //     ip_address: notification.ipAddress,
      //     user_agent: notification.userAgent
      //   }
      // });
    } catch (error) {
      console.error('Failed to send password change notification:', error);
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: string, metadata: any): Promise<void> {
    try {
      console.log('Security event:', { event, metadata, timestamp: new Date().toISOString() });
      
      // In a real app, you would store this in an audit log table
      // await supabase.from('security_events').insert({
      //   event_type: event,
      //   metadata: metadata,
      //   timestamp: new Date().toISOString(),
      //   ip_address: await this.getClientIP(),
      //   user_agent: navigator.userAgent
      // });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get client IP address (simplified version)
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      // In a real app, you might use a service to get the real IP
      // For now, return undefined
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Clear rate limiting data (for testing or admin purposes)
   */
  clearRateLimit(email: string): void {
    this.resetAttempts.delete(email);
  }

  /**
   * Get password strength score
   */
  getPasswordStrength(password: string): { score: number; feedback: string[] } {
    const { strength, failedRequirements } = validatePasswordStrength(password);
    
    const feedback: string[] = [];
    
    if (strength < 40) {
      feedback.push('Password is too weak');
    } else if (strength < 70) {
      feedback.push('Password could be stronger');
    } else {
      feedback.push('Password is strong');
    }
    
    if (failedRequirements.length > 0) {
      feedback.push(...failedRequirements);
    }
    
    if (this.isCommonPassword(password)) {
      feedback.push('Avoid common passwords');
    }
    
    return { score: strength, feedback };
  }
}

export const passwordService = new PasswordService(); 