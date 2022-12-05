import type { MediaType } from '@server/constants/media';
import type Medialist from '@server/entity/Medialist';
import type { PaginatedResponse } from './common';

export interface MedialistResultsResponse extends PaginatedResponse {
  results: Medialist[];
}

export type MedialistItemRequestBody = {
  name?: string;
  year?: string;
  mediaType: MediaType;
  mediaId?: number;
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
  season?: number;
  episode?: number;
  userId?: number;
};

export type MedialistAddItem = {
  name?: string;
  year?: string;
  mediaType?: MediaType;
  mediaId?: number;
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
  season?: number;
  episode?: number;
  userId?: number;
};
