// AI Service for Research Report Generation
// This service provides AI-powered content generation for research documentation

export interface AIGenerationContext {
  businessProfile: any;
  selectedActivities: any[];
  selectedSteps: any[];
  selectedSubcomponents: any[];
  userPreferences?: {
    tone: 'professional' | 'technical' | 'casual';
    detailLevel: 'brief' | 'standard' | 'comprehensive';
    focusAreas?: string[];
  };
}

interface RequestQueueItem {
  prompt: string;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

export class AIService {
  private static instance: AIService;
  private requestQueue: RequestQueueItem[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const item = this.requestQueue.shift()!;
      
      try {
        // Ensure rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
          await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
        }

        const result = await this.makeOpenAIRequest(item.prompt);
        this.lastRequestTime = Date.now();
        item.resolve(result);
      } catch (error) {
        item.reject(error as Error);
      }
    }

    this.isProcessing = false;
  }

  private async makeOpenAIRequest(prompt: string, systemPrompt?: string): Promise<string> {
    const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
    
    if (!functionsUrl) {
      throw new Error('Supabase functions URL not configured');
    }

    // Get current auth session for the request
    const { supabase } = await import('../lib/supabase');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Authentication required for AI services');
    }

    const response = await fetch(`${functionsUrl}/ai-service/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        prompt,
        systemPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      throw new Error(`AI service error: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`AI generation failed: ${data.error}`);
    }
    
    return data.content || 'Unable to generate content at this time.';
  }

  async generateContent(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ prompt, resolve, reject });
      this.processQueue();
    });
  }

  async generateSubcomponentBestPractices(
    subcomponentName: string, 
    description: string, 
    availableRoles: Array<{id: string, name: string}> = []
  ): Promise<string> {
    try {
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
      
      if (!functionsUrl) {
        throw new Error('Supabase functions URL not configured');
      }

      // Get current auth session for the request
      const { supabase } = await import('../lib/supabase');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required for AI services');
      }

      const response = await fetch(`${functionsUrl}/ai-service/generate-subcomponent-best-practices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          subcomponentName,
          description,
          availableRoles
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI service error: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`AI generation failed: ${data.error}`);
      }
      
      return data.content || this.getFallbackContent(subcomponentName, availableRoles);
      
    } catch (error) {
      console.error('AI generation failed:', error);
      return this.getFallbackContent(subcomponentName, availableRoles);
    }
  }

  private formatAIContent(content: string): string {
    // Ensure proper markdown formatting
    let formatted = content.trim();
    
    // Ensure headings are properly formatted
    formatted = formatted.replace(/^([^#\n]+)$/gm, (match, line) => {
      if (line.includes('Step ') && !line.startsWith('#')) {
        return `### ${line}`;
      }
      return match;
    });

    return formatted;
  }

  private getFallbackContent(subcomponentName: string, availableRoles: Array<{id: string, name: string}> = []): string {
    const roleNames = availableRoles && availableRoles.length > 0 
      ? availableRoles.map(role => role.name)
      : ['Medical Staff', 'Administrative Staff', 'Research Coordinators'];
    
    return `### Implementation Guidelines for ${subcomponentName}

### Step 1: Planning and Preparation
**Description**: Establish the foundational requirements and protocols for implementation.

**Roles Involved**:
${roleNames.slice(0, 2).map(role => `- **${role}**: Lead planning and coordination`).join('\n')}

### Step 2: Training and Education
**Description**: Conduct comprehensive training sessions for all involved staff members.

**Roles Involved**:
${roleNames.map(role => `- **${role}**: Participate in training protocols`).join('\n')}

### Step 3: Implementation and Monitoring
**Description**: Execute the protocol while maintaining careful monitoring and documentation.

**Roles Involved**:
${roleNames.map(role => `- **${role}**: Execute assigned responsibilities and document outcomes`).join('\n')}

### Step 4: Review and Optimization
**Description**: Evaluate effectiveness and make necessary adjustments to improve outcomes.

**Roles Involved**:
${roleNames.slice(0, Math.min(2, roleNames.length)).map(role => `- **${role}**: Lead review process and implement improvements`).join('\n')}`;
  }

  public async generateResearchContent(
    prompt: string,
    context: AIGenerationContext
  ): Promise<string> {
    try {
      return await this.generateContent(prompt);
    } catch (error) {
      console.warn('AI service unavailable. Using fallback content generation.', error);
      return this.generateFallbackContent(prompt, context);
    }
  }

  private generateFallbackContent(prompt: string, context: AIGenerationContext): string {
    // Fallback content generation when AI service is unavailable
    const { businessProfile, selectedActivities } = context;
    
    if (prompt.includes('executive summary')) {
      return `This comprehensive report documents the qualified research activities undertaken by ${businessProfile.name} 
      in accordance with IRC Section 41 requirements for the Research & Development Tax Credit. 
      The research activities documented herein demonstrate systematic experimentation aimed at discovering 
      technological information to develop new or improved business components.`;
    }

    if (prompt.includes('research goal')) {
      return `The primary research goal is to develop innovative solutions that improve clinical outcomes, 
      enhance patient care, and advance medical technology. This research addresses technological uncertainties 
      through systematic experimentation and follows established clinical practice guidelines.`;
    }

    if (prompt.includes('methodology')) {
      return `Research methodology follows a systematic approach including hypothesis development, 
      experimental design, data collection, analysis, and validation. All activities are documented 
      according to industry standards and IRS requirements for qualified research.`;
    }

    return `This research activity demonstrates qualified research under IRC Section 41, involving 
    systematic experimentation to resolve technological uncertainties in the development of new or 
    improved business components.`;
  }

  public async generateActivityDescription(activity: any): Promise<string> {
    const context: AIGenerationContext = {
      businessProfile: {},
      selectedActivities: [activity],
      selectedSteps: [],
      selectedSubcomponents: []
    };

    return this.generateResearchContent(
      'Generate a detailed description of this research activity, including its goals, methodology, and expected outcomes.',
      context
    );
  }

  public async generateStepDescription(step: any): Promise<string> {
    const context: AIGenerationContext = {
      businessProfile: {},
      selectedActivities: [],
      selectedSteps: [step],
      selectedSubcomponents: []
    };

    return this.generateResearchContent(
      'Generate a detailed description of this research step, including its purpose, methodology, and contribution to the overall research effort.',
      context
    );
  }

  public async generateSubcomponentDescription(subcomponent: any): Promise<string> {
    const context: AIGenerationContext = {
      businessProfile: {},
      selectedActivities: [],
      selectedSteps: [],
      selectedSubcomponents: [subcomponent]
    };

    return this.generateResearchContent(
      'Generate a detailed description of this research subcomponent, including its specific goals, methodology, and expected outcomes.',
      context
    );
  }

  public async generateLine49fDescription(line49fContext: any): Promise<string> {
    try {
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
      
      if (!functionsUrl) {
        throw new Error('Supabase functions URL not configured');
      }

      // Get current auth session for the request
      const { supabase } = await import('../lib/supabase');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required for AI services');
      }

      const response = await fetch(`${functionsUrl}/ai-service/generate-line49f-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(line49fContext)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI service error: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`AI generation failed: ${data.error}`);
      }
      
      return data.content || 'Unable to generate Line 49(f) description at this time.';
      
    } catch (error) {
      console.error('Line 49(f) generation failed:', error);
      return `This research activity demonstrates qualified research under IRC Section 41, involving systematic experimentation to resolve technological uncertainties in the development of new or improved business components.`;
    }
  }

  public async generateComplianceSummary(context: AIGenerationContext): Promise<string> {
    return this.generateResearchContent(
      'Generate a compliance summary that demonstrates how the research activities meet the four-part test for qualified research under IRC Section 41.',
      context
    );
  }

  public async generateDocumentationChecklist(context: AIGenerationContext): Promise<string[]> {
    const checklist = await this.generateResearchContent(
      'Generate a comprehensive checklist of required documentation for R&D tax credit compliance, including specific items needed for audit support.',
      context
    );

    // Parse the response into a structured checklist
    return checklist
      .split('\n')
      .filter(item => item.trim().length > 0)
      .map(item => item.replace(/^[-*]\s*/, '').trim());
  }

  public async validateResearchQualification(activity: any): Promise<{
    qualified: boolean;
    reasons: string[];
    recommendations: string[];
  }> {
    const context: AIGenerationContext = {
      businessProfile: {},
      selectedActivities: [activity],
      selectedSteps: [],
      selectedSubcomponents: []
    };

    const validation = await this.generateResearchContent(
      'Analyze this research activity for qualification under IRC Section 41. Determine if it meets the four-part test and provide specific reasons and recommendations.',
      context
    );

    // Parse the validation response
    return {
      qualified: validation.toLowerCase().includes('qualified'),
      reasons: [validation],
      recommendations: ['Ensure proper documentation', 'Maintain detailed records']
    };
  }

  public async generateTechnicalSpecifications(activity: any): Promise<string> {
    const context: AIGenerationContext = {
      businessProfile: {},
      selectedActivities: [activity],
      selectedSteps: [],
      selectedSubcomponents: []
    };

    return this.generateResearchContent(
      'Generate detailed technical specifications for this research activity, including technical requirements, constraints, and implementation details.',
      context
    );
  }

  public async generateRiskAssessment(activity: any): Promise<string> {
    const context: AIGenerationContext = {
      businessProfile: {},
      selectedActivities: [activity],
      selectedSteps: [],
      selectedSubcomponents: []
    };

    return this.generateResearchContent(
      'Generate a risk assessment for this research activity, including technical risks, timeline risks, and mitigation strategies.',
      context
    );
  }

  public async generateCostBenefitAnalysis(activity: any): Promise<string> {
    const context: AIGenerationContext = {
      businessProfile: {},
      selectedActivities: [activity],
      selectedSteps: [],
      selectedSubcomponents: []
    };

    return this.generateResearchContent(
      'Generate a cost-benefit analysis for this research activity, including expected costs, potential benefits, and return on investment.',
      context
    );
  }
}

// Export singleton instance
export const aiService = AIService.getInstance(); 