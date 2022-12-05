import type { MediaType } from '@server/constants/media';

export interface GenreSliderItem {
  id: number;
  name: string;
  backdrops: string[];
}

export interface WatchlistItem {
  ratingKey: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
}

export interface WatchlistResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: WatchlistItem[];
}
