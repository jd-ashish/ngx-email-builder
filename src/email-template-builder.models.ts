export type TemplateBlockType =
  | 'hero'
  | 'header'
  | 'text'
  | 'paragraph'
  | 'image'
  | 'columns'
  | 'quote'
  | 'button'
  | 'coupon'
  | 'list'
  | 'badge'
  | 'divider'
  | 'spacer'
  | 'footer'
  | 'social';

export type EditorView = 'canvas' | 'source';
export type ResizeSide = 'left' | 'right';
export type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export interface SocialLink {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'custom' | 'website' | 'email';
  url: string;
  icon?: string;
  iconType?: 'material' | 'url' | 'svg';
  label?: string;
}

export interface TemplateBlock {
  id: number;
  type: TemplateBlockType;
  label: string;
  icon: string;
  title?: string;
  text?: string;
  secondaryText?: string;
  url?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  titleColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  columnCount?: number;
  columns?: TemplateBlock[][];
  padding?: number;
  radius?: number;
  socialLinks?: SocialLink[];
}

export interface BlockPreset {
  type: TemplateBlockType;
  label: string;
  icon: string;
  description: string;
  columnCount?: number;
}

export interface TemplateVariable {
  id: number;
  name: string;
  value: string;
}

export interface BlockUpdate {
  key: keyof TemplateBlock;
  value: TemplateBlock[keyof TemplateBlock];
}

export interface VariableUpdate {
  id: number;
  key: 'name' | 'value';
  value: string;
}

export interface SampleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  accentColor: string;
  blocks: TemplateBlock[];
}
