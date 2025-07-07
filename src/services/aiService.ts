import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for browser environment
});

export interface AIGenerationContext {
  research_activity_name: string;
  practice_percentage: number;
  roles_involved: string[];
  frequency_percent?: number;
  notes?: string;
  industry_type: string;
  category?: string;
}

export interface AIGeneratedAnswers {
  hypothesis: string;
  development_steps: string;
  data_feedback: string;
}

export class AIService {
  static async generateHypothesis(context: AIGenerationContext): Promise<string> {
    const prompt = `Generate a concise explanation of the hypothesis tested during an R&D project. 
Use this context:
- Activity: ${context.research_activity_name}
- Roles involved: ${context.roles_involved.join(', ')}
- Practice %: ${context.practice_percentage}%
- Frequency of application: ${context.frequency_percent || 100}%
- Industry: ${context.category || context.industry_type}

Summarize as a single, clear hypothesis, framed in a way that highlights technical uncertainty and the goal of improvement, justifying R&D in this business component. Integrate IRS-qualifying language for the R&D tax credit.

Keep the response concise (2-3 sentences) and professional.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in R&D tax credit documentation. Provide clear, professional responses that qualify for IRS R&D tax credit requirements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate hypothesis';
    } catch (error) {
      console.error('Error generating hypothesis:', error);
      return 'Unable to generate hypothesis at this time';
    }
  }

  static async generateDevelopmentSteps(context: AIGenerationContext): Promise<string> {
    const prompt = `Summarize the key development or testing steps taken during the activity "${context.research_activity_name}" in the ${context.industry_type} industry.

Include role involvement (${context.roles_involved.join(', ')}), practice implementation (%: ${context.practice_percentage}), and emphasize the iterative nature of the process.

Keep the output clear, concise, and framed for an R&D tax credit report.

Example Output:
"Our lead clinicians and imaging coordinators implemented the workflow across patient samples, reviewed post-op results, and revised the protocol based on guide fit accuracy and healing rates."`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in R&D tax credit documentation. Provide clear, professional responses that qualify for IRS R&D tax credit requirements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate development steps';
    } catch (error) {
      console.error('Error generating development steps:', error);
      return 'Unable to generate development steps at this time';
    }
  }

  static async generateDataFeedback(context: AIGenerationContext): Promise<string> {
    const prompt = `Describe the data or observations collected to evaluate the success of the activity "${context.research_activity_name}" in the ${context.industry_type} space.

Reference the types of metrics commonly tracked in private practice or private business ownership, aligned with a practice percentage of ${context.practice_percentage}%. Include who was involved (${context.roles_involved.join(', ')}) in collecting or interpreting the data.

Respond in a formal, tax-compliant tone.

Example Output:
"Success was evaluated by tracking guide fit, post-operative outcomes, and reduction in procedure time. Clinicians and assistants jointly reviewed deviations to determine reliability and improvement."`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in R&D tax credit documentation. Provide clear, professional responses that qualify for IRS R&D tax credit requirements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate data feedback';
    } catch (error) {
      console.error('Error generating data feedback:', error);
      return 'Unable to generate data feedback at this time';
    }
  }

  static async generateAllAnswers(context: AIGenerationContext): Promise<AIGeneratedAnswers> {
    try {
      const [hypothesis, developmentSteps, dataFeedback] = await Promise.all([
        this.generateHypothesis(context),
        this.generateDevelopmentSteps(context),
        this.generateDataFeedback(context)
      ]);

      return {
        hypothesis,
        development_steps: developmentSteps,
        data_feedback: dataFeedback
      };
    } catch (error) {
      console.error('Error generating all answers:', error);
      return {
        hypothesis: 'Unable to generate hypothesis',
        development_steps: 'Unable to generate development steps',
        data_feedback: 'Unable to generate data feedback'
      };
    }
  }
} 