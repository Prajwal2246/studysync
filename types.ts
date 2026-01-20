export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  senderName: string;
  text: string;
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
  isMapResponse?: boolean;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        content: string;
      }[];
    }[];
  };
}

export type AIMode = 'search' | 'maps';
