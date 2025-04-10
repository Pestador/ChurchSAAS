import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export enum VoiceGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum VoiceAccent {
  AMERICAN = 'AMERICAN',
  BRITISH = 'BRITISH',
  AUSTRALIAN = 'AUSTRALIAN',
  INDIAN = 'INDIAN',
}

export enum VoiceStyle {
  CONVERSATIONAL = 'CONVERSATIONAL',
  NARRATIVE = 'NARRATIVE',
  PREACHING = 'PREACHING',
}

export interface TTSOptions {
  voiceId?: string;
  gender?: VoiceGender;
  accent?: VoiceAccent;
  style?: VoiceStyle;
  stability?: number;
  similarity_boost?: number;
  speakerBoost?: boolean;
  modelId?: string;
}

export interface TTSResponse {
  audioUrl: string;
  durationSeconds: number;
  wordCount: number;
}

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.elevenlabs.io/v1';
  private readonly defaultModelId = 'eleven_turbo_v2';
  
  // Pre-defined voice IDs from Eleven Labs
  private readonly defaultVoices = {
    MALE: {
      AMERICAN: {
        CONVERSATIONAL: '21m00Tcm4TlvDq8ikWAM', // Josh
        NARRATIVE: 'TxGEqnHWrfWFTfGW9XjX',      // Arnold
        PREACHING: 'g5CIjZEefAph4nQFvHAz',      // Daniel
      },
      BRITISH: {
        CONVERSATIONAL: 'pNInz6obpgDQGcFmaJgB', // Adam
        NARRATIVE: 'SOYHLrjzK2X1ezoPC6cr',      // Thomas
        PREACHING: 'ODq5zmih8GrVes37Dizd',      // Harry
      },
    },
    FEMALE: {
      AMERICAN: {
        CONVERSATIONAL: 'EXAVITQu4vr4xnSDxMaL', // Sarah
        NARRATIVE: '21m00Tcm4TlvDq8ikWAM',      // Rachel
        PREACHING: 'D38z5RcWu1voky8WS1ja',      // Bella
      },
      BRITISH: {
        CONVERSATIONAL: 'oWAxZDx7w5VEj9dCyTzz', // Grace
        NARRATIVE: 'MF3mGyEYCl7XYWbV9V6O',      // Emily
        PREACHING: 'jBpfuIE2acCO8z3wKNLl',      // Charlotte
      },
    },
  };
  
  // Directory to save audio files
  private readonly audioDir = 'public/audio';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    
    // Create the audio directory if it doesn't exist
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
      this.logger.log(`Created audio directory: ${this.audioDir}`);
    }
  }

  /**
   * Generate text-to-speech audio from the given text
   * @param text The text to convert to speech
   * @param options The TTS options (voice, style, etc.)
   * @returns The URL to the audio file and metadata
   */
  async generateSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    try {
      // Ensure we have the API key
      if (!this.apiKey) {
        throw new Error('Missing Eleven Labs API key');
      }
      
      // Select the appropriate voice based on options
      const voiceId = options.voiceId || this.getVoiceId(options);
      
      // Prepare the request payload
      const payload = {
        text,
        model_id: options.modelId || this.defaultModelId,
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity_boost || 0.5,
          style: options.style ? this.mapStyleToValue(options.style) : 0.0,
          use_speaker_boost: options.speakerBoost !== undefined ? options.speakerBoost : true,
        },
      };
      
      const response = await axios.post(
        `${this.apiUrl}/text-to-speech/${voiceId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer',
        },
      );
      
      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `tts_${timestamp}.mp3`;
      const filePath = path.join(this.audioDir, filename);
      
      // Save the audio file
      fs.writeFileSync(filePath, response.data);
      
      // Calculate approximate duration (rough estimate: 150 words per minute)
      const wordCount = this.countWords(text);
      const durationSeconds = Math.round((wordCount / 150) * 60);
      
      // Return the URL to the audio file
      const audioUrl = `/audio/${filename}`;
      
      this.logger.log(`Generated speech: ${wordCount} words, ~${durationSeconds} seconds, saved to ${filePath}`);
      
      return {
        audioUrl,
        durationSeconds,
        wordCount,
      };
    } catch (error) {
      this.logger.error(`Failed to generate speech: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get the voice ID based on the specified options
   */
  private getVoiceId(options: TTSOptions): string {
    const gender = options.gender || VoiceGender.MALE;
    const accent = options.accent || VoiceAccent.AMERICAN;
    const style = options.style || VoiceStyle.CONVERSATIONAL;
    
    try {
      return this.defaultVoices[gender][accent][style];
    } catch (error) {
      this.logger.warn(`Could not find voice for gender=${gender}, accent=${accent}, style=${style}. Using default voice.`);
      return this.defaultVoices.MALE.AMERICAN.CONVERSATIONAL;
    }
  }
  
  /**
   * Maps VoiceStyle enum to a style value for the API
   */
  private mapStyleToValue(style: VoiceStyle): number {
    switch (style) {
      case VoiceStyle.PREACHING:
        return 0.8; // More dramatic
      case VoiceStyle.NARRATIVE:
        return 0.5; // Balanced
      case VoiceStyle.CONVERSATIONAL:
      default:
        return 0.3; // More natural
    }
  }
  
  /**
   * Count the number of words in a text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }
}
