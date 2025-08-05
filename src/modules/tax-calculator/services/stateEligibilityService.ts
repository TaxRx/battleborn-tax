import { getStateConfig } from '../components/StateProForma';

export interface EntityRequirements {
  allowedEntityTypes: string[];
  restrictedEntityTypes: string[];
  requiresApplication: boolean;
  requiresPreapproval: boolean;
  defaultEnabled: boolean;
  applicationWindow?: string;
  certificationRequired?: string;
}

export interface StateEligibilityResult {
  isEligible: boolean;
  warnings: string[];
  notifications: string[];
  requiresAction: boolean;
  actionRequired?: string;
  shouldDefaultOff: boolean;
}

export class StateEligibilityService {
  
  /**
   * Normalize entity type names to handle different naming conventions
   */
  private static normalizeEntityType(entityType: string): string {
    const normalizedType = entityType.toUpperCase().trim();
    
    // Handle common variations
    const mappings: Record<string, string> = {
      'SCORP': 'S-Corp',
      'S_CORP': 'S-Corp',
      'CCORP': 'Corporation',
      'C_CORP': 'Corporation',
      'CORP': 'Corporation',
      'LLC': 'LLC',
      'LP': 'Partnership',
      'LLP': 'Partnership',
      'PARTNERSHIP': 'Partnership',
      'INDIVIDUAL': 'Individual',
      'SOLE_PROPRIETORSHIP': 'Individual'
    };
    
    return mappings[normalizedType] || entityType;
  }
  
  /**
   * Check if a business entity type is eligible for a specific state's R&D credit
   */
  static checkStateEligibility(
    stateCode: string, 
    businessEntityType: string
  ): StateEligibilityResult {
    const stateConfig = getStateConfig(stateCode);
    const normalizedEntityType = this.normalizeEntityType(businessEntityType);
    
    if (!stateConfig) {
      // Don't show warnings for missing state configs - just treat as ineligible silently
      return {
        isEligible: false,
        warnings: [],
        notifications: [],
        requiresAction: false,
        shouldDefaultOff: true
      };
    }

    // Get entity requirements from state config
    const entityReqs = (stateConfig as any).entityRequirements as EntityRequirements;
    
    if (!entityReqs) {
      // No specific entity requirements defined - assume all entities allowed
      return {
        isEligible: true,
        warnings: [],
        notifications: [],
        requiresAction: false,
        shouldDefaultOff: false
      };
    }

    const result: StateEligibilityResult = {
      isEligible: true,
      warnings: [],
      notifications: [],
      requiresAction: false,
      shouldDefaultOff: entityReqs.defaultEnabled === false
    };

    // Check entity type eligibility
    if (entityReqs.restrictedEntityTypes?.includes(normalizedEntityType)) {
      result.isEligible = false;
      result.warnings.push(`${normalizedEntityType} entities are not eligible for ${stateConfig.name} R&D credit`);
      result.shouldDefaultOff = true;
    } else if (entityReqs.allowedEntityTypes?.length > 0 && 
               !entityReqs.allowedEntityTypes.includes(normalizedEntityType)) {
      result.isEligible = false;
      result.warnings.push(`${normalizedEntityType} entities are not eligible for ${stateConfig.name} R&D credit`);
      result.shouldDefaultOff = true;
    }

    // Check application requirements
    if (entityReqs.requiresApplication && result.isEligible) {
      result.requiresAction = true;
      result.actionRequired = 'application';
      result.shouldDefaultOff = true;
      result.notifications.push(
        `${stateConfig.name} requires a separate application${entityReqs.applicationWindow ? ` (${entityReqs.applicationWindow})` : ''}`
      );
    }

    // Check preapproval requirements
    if (entityReqs.requiresPreapproval && result.isEligible) {
      result.requiresAction = true;
      result.actionRequired = 'preapproval';
      result.shouldDefaultOff = true;
      result.notifications.push(
        `${stateConfig.name} requires preapproval${entityReqs.certificationRequired ? ` from ${entityReqs.certificationRequired}` : ''}`
      );
    }

    return result;
  }

  /**
   * Get all state eligibility results for a business entity type
   */
  static checkAllStatesEligibility(businessEntityType: string): Record<string, StateEligibilityResult> {
    const results: Record<string, StateEligibilityResult> = {};
    const normalizedEntityType = this.normalizeEntityType(businessEntityType);
    
    // Only check states that actually have configurations
    const stateCodesWithCredits = [
      'CA', 'AK', 'AZ', 'CT', 'FL', 'GA', 'IL', 'MD', 'MA', 'MI', 'NC',
      'NH', 'NJ', 'NY', 'OH', 'PA', 'RI', 'TX', 'UT', 'VA', 'VT', 'WA'
      // Removed ND and SC as they don't have proper configurations yet
    ];

    for (const stateCode of stateCodesWithCredits) {
      const eligibility = this.checkStateEligibility(stateCode, normalizedEntityType);
      // Only include states with actual configurations
      if (eligibility.isEligible !== false || eligibility.warnings.length > 0 || eligibility.notifications.length > 0) {
        results[stateCode] = eligibility;
      }
    }

    return results;
  }

  /**
   * Get formatted notification messages for display in UI
   */
  static getNotificationMessages(eligibilityResults: Record<string, StateEligibilityResult>): {
    applicationRequired: string[];
    preapprovalRequired: string[];
    entityRestricted: string[];
  } {
    const notifications = {
      applicationRequired: [] as string[],
      preapprovalRequired: [] as string[],
      entityRestricted: [] as string[]
    };

    for (const [stateCode, result] of Object.entries(eligibilityResults)) {
      if (!result.isEligible) {
        notifications.entityRestricted.push(...result.warnings);
      } else if (result.requiresAction) {
        if (result.actionRequired === 'application') {
          notifications.applicationRequired.push(...result.notifications);
        } else if (result.actionRequired === 'preapproval') {
          notifications.preapprovalRequired.push(...result.notifications);
        }
      }
    }

    return notifications;
  }
}