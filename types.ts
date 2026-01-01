
export type CoverSize = 
  | 'FRONT_COVER' 
  | 'SPINE' 
  | 'CONTENT_LAYOUT' 
  | 'BACK_COVER';

export type CoverStyle = 
  | 'Minimalis' 
  | 'Tipografis' 
  | 'Vintage' 
  | 'Ilustratif' 
  | 'Profesional Korporat' 
  | 'Industrial' 
  | 'Pop Art' 
  | 'Dark' 
  | 'no';

export type CoverGenre = 
  | 'Literary' 
  | 'True Crime' 
  | 'Fantasy' 
  | 'Romance' 
  | 'Self Help' 
  | 'no';

export type CoverTrend = 
  | 'Swiss style' 
  | 'maximalist' 
  | 'flat design' 
  | 'surealist' 
  | 'brutalism' 
  | 'no';

export type CoverTexture = 
  | 'organic' 
  | 'Futuristik' 
  | 'no';

export interface BookCoverForm {
  title: string;
  author: string;
  designIdea: string;
  blurb: string;
  size: CoverSize;
  style: CoverStyle;
  genre: CoverGenre;
  trend: CoverTrend;
  texture: CoverTexture;
  imageCount: number;
  references: string[]; // base64 strings
  logo?: string; // base64 string for front cover (top-right)
  backLogo?: string; // base64 string for back cover (bottom-left)
}

export interface GeneratedImage {
  url: string;
  id: string;
}
