export type TileId = string; // "r-c"

export interface Area {
  label: string;
  color: string; // #rrggbb
  tiles: TileId[]; // list of tile ids like "r-c"
}

export interface Board {
  slug: string;
  rows: number;
  cols: number;
  areas: Area[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CardStatus = 'delegate' | 'decide' | 'do' | 'decline';

import type { ObjectId } from 'mongodb'

export interface CardDoc {
  _id?: ObjectId; // mongodb ObjectId
  text: string;
  status: CardStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  boardSlug?: string;
  /**
   * Deprecated: legacy single-label placement across boards.
   * Why kept: backward compatibility for older UIs. New UIs must ignore this value.
   */
  areaLabel?: string;
  /**
   * Per-board placements: mapping from board slug -> canonical area label on that board.
   * Why: Enables N-dimensional classification; spock is never persisted (empty mapping implies spock fallback where available).
   */
  boardAreas?: Record<string, string>;
}

export interface Card {
  id: string;
  text: string;
  status: CardStatus;
  order: number;
  createdAt: string; // ISO 8601 with ms
  updatedAt: string; // ISO 8601 with ms
  boardSlug?: string;
  /** @deprecated — see Card.boardAreas */
  areaLabel?: string;
  boardAreas?: Record<string, string>;
}
