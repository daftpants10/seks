import { createClient } from '@deepgram/sdk';
import fs from 'fs';

export interface TranscriptionResult {
  transcript: string;
  hasSpeech: boolean;
  confidence: number;
  duration: number;
}

export async function transcribeAudio(filePath: string): Promise<TranscriptionResult> {
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

  const audioBuffer = fs.readFileSync(filePath);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: 'nova-2',
      smart_format: true,
      punctuate: true,
      utterances: true,
      language: 'en',
    }
  );

  if (error) {
    throw new Error(`Deepgram error: ${error.message}`);
  }

  const channel = result?.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const transcript = alternative?.transcript || '';
  const confidence = alternative?.confidence || 0;
  const duration = result?.metadata?.duration || 0;

  // Consider it "spoken" if confidence > 0.3 and there's actual text
  const hasSpeech = confidence > 0.3 && transcript.trim().length > 5;

  return {
    transcript,
    hasSpeech,
    confidence,
    duration,
  };
}
