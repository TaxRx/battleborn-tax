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

export class AIService {
  private static instance: AIService;
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.openai.com/v1';

  private constructor() {
    // Initialize with environment variable if available
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  public async generateResearchContent(
    prompt: string,
    context: AIGenerationContext
  ): Promise<string> {
    if (!this.apiKey) {
      console.warn('OpenAI API key not configured. Using fallback content generation.');
      return this.generateFallbackContent(prompt, context);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert in R&D tax credit documentation and clinical practice guidelines. 
              Generate professional, accurate content for research reports that follows IRS guidelines and 
              industry best practices. Focus on clear, technical descriptions that demonstrate qualified 
              research activities.`
            },
            {
              role: 'user',
              content: `${prompt}\n\nContext: ${JSON.stringify(context, null, 2)}`
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Content generation failed.';
    } catch (error) {
      console.error('AI content generation failed:', error);
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