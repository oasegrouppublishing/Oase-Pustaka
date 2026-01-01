
import React from 'react';

export const SIZE_LABELS = {
  FRONT_COVER: 'Cover Depan Buku (1000 x 1500 px)',
  SPINE: 'Punggung Buku (230 x 2500 px) Vertical',
  CONTENT_LAYOUT: 'Layout Isi Naskah (350 x 2250 px) Horizontal',
  BACK_COVER: 'Cover Belakang Buku (1000 x 1500 px)',
};

export const STYLE_OPTIONS = ['Minimalis', 'Tipografis', 'Vintage', 'Ilustratif', 'Profesional Korporat', 'Industrial', 'Pop Art', 'Dark', 'no'];
export const GENRE_OPTIONS = ['Literary', 'True Crime', 'Fantasy', 'Romance', 'Self Help', 'no'];
export const TREND_OPTIONS = ['Swiss style', 'maximalist', 'flat design', 'surealist', 'brutalism', 'no'];
export const TEXTURE_OPTIONS = ['organic', 'Futuristik', 'no'];

export const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export const LoadingIcon = () => (
  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
