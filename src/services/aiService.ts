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

  private async makeOpenAIRequest(prompt: string): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a healthcare industry expert specializing in clinical practice guidelines and R&D tax credit compliance. Provide detailed, professional responses with proper formatting using markdown. Focus on practical implementation steps that integrate specific staff roles and responsibilities. Include detailed workflows, timelines, and measurable outcomes for each step.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Unable to generate content at this time.';
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
    const roleNames = availableRoles && availableRoles.length > 0 
      ? availableRoles.map(role => role.name).join(', ')
      : 'Medical Staff, Administrative Staff, Research Coordinators';
    
    const prompt = `Generate comprehensive clinical practice guidelines for implementing "${subcomponentName}" in a healthcare setting for R&D tax credit documentation purposes.

Subcomponent Description: ${description}

Available Staff Roles: ${roleNames}

Please provide detailed implementation guidelines that include:

1. **Pre-Implementation Planning** (### Planning Phase)
   - Risk assessment and mitigation strategies
   - Resource allocation requirements
   - Timeline development (specific weeks/months)
   - Role-specific training requirements
   - Measurable success criteria

2. **Implementation Steps** (### Step 1, ### Step 2, etc.)
   - Detailed 5-7 implementation steps with specific actions
   - For each step, specify:
     * Primary responsible roles from the available list
     * Supporting roles and their specific contributions
     * Time allocation estimates (hours/week per role)
     * Documentation requirements for R&D compliance
     * Quality control checkpoints
     * Risk factors and mitigation steps

3. **Monitoring & Documentation** (### Monitoring Phase)
   - Key performance indicators (KPIs)
   - Documentation protocols for R&D substantiation
   - Regular review schedules
   - Compliance verification methods

4. **Optimization & Continuous Improvement** (### Optimization Phase)
   - Performance review criteria
   - Feedback collection methods
   - Process refinement protocols
   - Staff development opportunities

Format requirements:
- Use markdown headings (### for main sections)
- Include specific role assignments with time commitments
- Add implementation timelines
- Focus on measurable, documentable activities
- Ensure all roles from the available list are meaningfully integrated
- Include R&D tax credit compliance considerations`;

    try {
      const content = await this.generateContent(prompt);
      return this.formatAIContent(content);
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
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured. Using fallback content generation.');
      return this.generateFallbackContent(prompt, context);
    }

    return this.generateContent(prompt);
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
    const { research_activity_name, subcomponent_count, subcomponent_groups, industry } = line49fContext;
    
    const prompt = `Generate a professional Line 49(f) description for Form 6765 Section G Business Component Information. 

Context:
- Research Activity: ${research_activity_name}
- Number of Subcomponents: ${subcomponent_count}
- Subcomponent Types: ${subcomponent_groups}
- Industry: ${industry}

Requirements:
- Professional tone suitable for IRS filing
- Describe the systematic experimentation and research methodology
- Explain how the research resolves technical uncertainty
- Include specific mention of the subcomponents evaluated
- Keep to 2-3 sentences maximum
- Focus on the research process and technical development

Generate a concise, professional description that demonstrates qualified research activities under IRC Section 41.`;

    const context: AIGenerationContext = {
      businessProfile: { industry },
      selectedActivities: [{ name: research_activity_name }],
      selectedSteps: [],
      selectedSubcomponents: []
    };

    return this.generateResearchContent(prompt, context);
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