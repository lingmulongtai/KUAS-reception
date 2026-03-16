// Card generation service (returns SVG-based card data as JSON for client-side rendering)
// Note: Full Puppeteer/canvas implementation would require additional setup

export interface CardData {
  username: string;
  avatarUrl: string;
  name: string | null;
  topLanguages: Array<{ name: string; percentage: number; color: string }>;
  personalityScores: {
    creator: number;
    collaborator: number;
    communicator: number;
    maintainer: number;
    explorer: number;
  };
}

export function generateCardData(data: CardData): CardData {
  return data;
}
