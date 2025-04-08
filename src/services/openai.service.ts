import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export type SermonDenomination = 
  | 'nondenominational' 
  | 'baptist' 
  | 'catholic' 
  | 'methodist' 
  | 'lutheran' 
  | 'presbyterian' 
  | 'pentecostal' 
  | 'anglican' 
  | 'orthodox';

export type SermonTheologicalFramework = 
  | 'evangelical' 
  | 'reformed' 
  | 'armenian' 
  | 'liberation' 
  | 'progressive' 
  | 'traditional';

export type SermonStyle = 
  | 'expository' 
  | 'topical' 
  | 'narrative' 
  | 'textual' 
  | 'practical' 
  | 'devotional';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor() {
    // Initialize OpenAI client using API key from environment variable
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a sermon based on the given prompt data
   * @param promptData The data to use for generating the sermon
   * @returns The generated sermon content
   */
  async generateSermon(promptData: {
    title?: string;
    theme?: string;
    bibleVerses?: string[];
    audience?: string;
    length?: 'short' | 'medium' | 'long';
    style?: string;
    denomination?: SermonDenomination;
    theologicalFramework?: SermonTheologicalFramework;
    includeIllustrations?: boolean;
    includeApplicationPoints?: boolean;
    includeClosingPrayer?: boolean;
    additionalInstructions?: string;
  }): Promise<{ content: string; title: string }> {
    try {
      // Build a more sophisticated system prompt with theological and structural guidance
      const systemPrompt = this.buildSermonSystemPrompt(promptData);

      // Construct a detailed user prompt with additional context and structure
      const userPrompt = this.buildSermonUserPrompt(promptData);

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const generatedContent = response.choices[0]?.message?.content || '';
      
      // Extract title from generated content or use provided title
      let title = promptData.title || '';
      if (!title) {
        // Try to extract title from the first line if it looks like a title
        const firstLine = generatedContent.split('\n')[0];
        if (firstLine && firstLine.length < 100 && !firstLine.includes('.')) {
          title = firstLine.replace(/^#+ /, ''); // Remove markdown heading markers
        } else {
          title = 'AI Generated Sermon';
        }
      }

      return {
        content: generatedContent,
        title: title,
      };
    } catch (error) {
      this.logger.error(`Error generating sermon: ${error.message}`, error.stack);
      throw new Error(`Failed to generate sermon: ${error.message}`);
    }
  }

  /**
   * Creates a detailed system prompt for sermon generation based on provided parameters
   */
  private buildSermonSystemPrompt(promptData: any): string {
    // Base system prompt with role and general instructions
    let prompt = `You are an experienced pastoral assistant with deep theological knowledge and homiletic training. 
Your task is to write a compelling, biblically-sound sermon`;
    
    // Add denominational and theological framework context if provided
    if (promptData.denomination) {
      prompt += ` aligned with ${promptData.denomination} traditions`;
    }
    
    if (promptData.theologicalFramework) {
      prompt += ` and following a ${promptData.theologicalFramework} theological framework`;
    }
    
    // Add basic sermon structure guidance
    prompt += `.\n\nYour sermon should include:
1. A strong introduction that establishes the biblical foundation and engages the audience
2. Clear, well-organized main points derived directly from Scripture
3. Biblical exegesis that is faithful to the original context
4. Theological insights that connect Scripture to contemporary life`;
    
    // Add optional structural elements based on preferences
    if (promptData.includeIllustrations) {
      prompt += `\n5. Relevant illustrations and stories that illuminate the message`;
    }
    
    if (promptData.includeApplicationPoints) {
      prompt += `\n6. Practical application points that help listeners implement the message`;
    }
    
    if (promptData.includeClosingPrayer) {
      prompt += `\n7. A meaningful closing prayer that reinforces the sermon's key points`;
    }
    
    // Add guidance on tone and approach
    prompt += `\n\nEnsure your sermon:
- Uses accessible language while maintaining theological accuracy
- Balances scholarly insight with practical wisdom
- Respects the historical and cultural context of Scripture
- Addresses both the heart and mind of the listener
- Remains faithful to the denomination's theological positions and biblical interpretations
- Citations of scripture should use proper citation format`;
    
    return prompt;
  }

  /**
   * Creates a detailed user prompt for sermon generation with precise instructions
   */
  private buildSermonUserPrompt(promptData: any): string {
    // Start with basic request
    let prompt = 'Please write a sermon';
    
    // Add title if provided
    if (promptData.title) {
      prompt += ` with the title "${promptData.title}"`;
    }
    
    // Add theme if provided
    if (promptData.theme) {
      prompt += ` on the theme of ${promptData.theme}`;
    }
    
    // Handle Bible verses with enhanced context
    if (promptData.bibleVerses && promptData.bibleVerses.length > 0) {
      if (promptData.bibleVerses.length === 1) {
        prompt += ` based on ${promptData.bibleVerses[0]}`;
      } else {
        const lastVerse = promptData.bibleVerses.pop();
        prompt += ` based on ${promptData.bibleVerses.join(', ')} and ${lastVerse}`;
        // Restore the array
        promptData.bibleVerses.push(lastVerse);
      }
      
      // Add instruction to include proper exegesis
      prompt += `. Include thoughtful exegesis of these passages, considering their historical and literary context`;
    }
    
    // Add audience targeting
    if (promptData.audience) {
      prompt += `. This sermon will be delivered to ${promptData.audience}`;
    }
    
    // Add length guidance with more precise word counts
    if (promptData.length) {
      const wordCount = promptData.length === 'short' ? '800-1200' : 
                       promptData.length === 'medium' ? '1500-2500' : '3000-4000';
      prompt += `. The sermon should be approximately ${wordCount} words in length`;
    }
    
    // Add sermon style/approach
    if (promptData.style) {
      prompt += `. Use a ${promptData.style} preaching style`;
      
      // Add style-specific guidance
      if (promptData.style === 'expository') {
        prompt += ` that systematically explains the passage verse by verse`;
      } else if (promptData.style === 'topical') {
        prompt += ` that addresses the theme using multiple relevant scriptures`;
      } else if (promptData.style === 'narrative') {
        prompt += ` that tells the biblical story in an engaging way`;
      } else if (promptData.style === 'practical') {
        prompt += ` with clear, actionable application points`;
      }
    }
    
    // Add any additional custom instructions
    if (promptData.additionalInstructions) {
      prompt += `. ${promptData.additionalInstructions}`;
    }
    
    // Final instructions for formatting and title
    prompt += `.\n\nFormat the sermon in a clean, reader-friendly structure with appropriate headings and subheadings. Include a meaningful title if one wasn't provided. Make sure the sermon is engaging, biblically faithful, and applicable to contemporary life.`;
    
    return prompt;
  }

  /**
   * Generate Bible study explanations for specific verses
   * @param verses Array of Bible verse references to explain
   * @param options Additional options for the explanation
   * @returns Object mapping verse references to their explanations
   */
  async generateBibleExplanation(
    verses: string[],
    options: {
      depth?: 'basic' | 'detailed' | 'academic';
      style?: 'devotional' | 'educational' | 'practical';
      includeHistoricalContext?: boolean;
      includeCrossReferences?: boolean;
      includeApplicationPoints?: boolean;
      denomination?: SermonDenomination;
      theologicalFramework?: SermonTheologicalFramework;
      targetAudience?: string;
      context?: string;
    } = {}
  ): Promise<Record<string, string>> {
    try {
      // Default values if not provided
      const depth = options.depth || 'detailed';
      const style = options.style || 'educational';
      const includeHistoricalContext = options.includeHistoricalContext !== false;
      const includeCrossReferences = options.includeCrossReferences !== false;
      const includeApplicationPoints = options.includeApplicationPoints !== false;
      
      // Create system prompt
      const systemPrompt = this.buildBibleExplanationSystemPrompt(options);
      
      // Process each verse to get explanations
      const explanations: Record<string, string> = {};
      
      // We'll process each verse individually to get the best explanation
      for (const verse of verses) {
        const userPrompt = this.buildBibleExplanationUserPrompt(verse, options);
        
        // Call OpenAI API
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6, // Slightly lower temperature for more factual responses
          max_tokens: 2000,
        });

        const explanationContent = response.choices[0]?.message?.content || '';
        explanations[verse] = explanationContent;
      }
      
      return explanations;
    } catch (error) {
      this.logger.error(`Error generating Bible explanation: ${error.message}`, error.stack);
      throw new Error(`Failed to generate Bible explanation: ${error.message}`);
    }
  }
  
  /**
   * Creates a detailed system prompt for Bible verse explanation
   */
  private buildBibleExplanationSystemPrompt(options: any): string {
    const { 
      depth, 
      style, 
      denomination,
      theologicalFramework,
      targetAudience,
    } = options;
    
    let prompt = `You are a biblical scholar and theological educator with expertise in hermeneutics, biblical languages, and practical application of Scripture.`;
    
    // Add denominational context
    if (denomination) {
      prompt += ` You have particular knowledge of ${denomination} theological traditions and interpretations.`;
    }
    
    // Add theological framework
    if (theologicalFramework) {
      prompt += ` You approach Scripture from a ${theologicalFramework} theological framework.`;
    }
    
    // Add audience targeting
    if (targetAudience) {
      prompt += ` Your explanation should be tailored for ${targetAudience}.`;
    }
    
    // Add basic role instructions based on depth
    if (depth === 'basic') {
      prompt += `\n\nProvide a simple, accessible explanation of the provided Bible verse. Focus on the core message and primary meaning.`;
    } else if (depth === 'academic') {
      prompt += `\n\nProvide a scholarly, comprehensive analysis of the provided Bible verse. Include linguistic nuances, historical-cultural context, and theological significance.`;
    } else { // detailed (default)
      prompt += `\n\nProvide a thorough, balanced explanation of the provided Bible verse that includes both scholarly insights and practical applications.`;
    }
    
    // Add style guidance
    if (style === 'devotional') {
      prompt += ` Your tone should be warm, personal, and spiritually nurturing.`;
    } else if (style === 'practical') {
      prompt += ` Your tone should be pragmatic, focusing on real-world applications and actionable insights.`;
    } else if (style === 'educational') {
      prompt += ` Your tone should be informative and instructional, helping readers learn about the text's meaning.`;
    }
    
    // Add standard content requirements
    prompt += `\n\nYour explanation should include:
1. The verse's context within the larger biblical narrative
2. Key words or concepts and their meanings
3. The main theological teachings or principles conveyed`;
    
    // Add optional content based on options
    if (options.includeHistoricalContext) {
      prompt += `\n4. Historical and cultural background relevant to understanding the verse`;
    }
    
    if (options.includeCrossReferences) {
      prompt += `\n5. Relevant cross-references to other Scripture passages that illuminate this verse`;
    }
    
    if (options.includeApplicationPoints) {
      prompt += `\n6. Practical applications and relevance for contemporary life`;
    }
    
    // Add final guidance
    prompt += `\n\nEnsure your explanation is:
- Biblically accurate and faithful to the original meaning
- Well-structured and clearly presented
- Balanced between academic insight and spiritual application
- Respectful of various Christian traditions while being true to the denomination specified (if any)`;
    
    return prompt;
  }
  
  /**
   * Creates a specific user prompt for Bible verse explanation
   */
  private buildBibleExplanationUserPrompt(verse: string, options: any): string {
    const { context } = options;
    
    let prompt = `Please provide an explanation of ${verse}`;
    
    // Add study context if provided
    if (context) {
      prompt += ` in the context of a Bible study on ${context}`;
    }
    
    // Add specific requests based on depth
    if (options.depth === 'basic') {
      prompt += `. Keep the explanation accessible for newer Christians or those unfamiliar with the Bible.`;
    } else if (options.depth === 'academic') {
      prompt += `. Include original language insights, textual variants if relevant, and scholarly perspectives.`;
    } else { // detailed
      prompt += `. Balance scholarly insight with practical application for contemporary believers.`;
    }
    
    // Add formatting instructions
    prompt += `\n\nPlease format your explanation with proper headings, paragraphs, and bullet points where appropriate to enhance readability.`;
    
    return prompt;
  }
}
