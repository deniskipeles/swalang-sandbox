export interface Suggestion {
  id: number;
  swahiliTerm: string;
  author: string;
  description: string;
  useCaseCode: string;
  votes: number;
}

export interface Keyword {
  id: number;
  englishTerm: string;
  suggestions: Suggestion[];
  standardizedSuggestionId?: number | null;
}