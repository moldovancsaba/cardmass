export type TileId = string; // "r-c"

export interface Area {
  label: string;
  color: string; // #rrggbb (hashtag/chip color)
  tiles: TileId[]; // list of tile ids like "r-c"
  /** Optional: independent area background color (hex #rrggbb). */
  bgColor?: string;
  /** Optional: whether to render label text in black (true) or white (false). */
  textBlack?: boolean;
  /** Optional: row-first packing hint for dense layouts. */
  rowFirst?: boolean;
}

export interface Board {
  slug: string;
  rows: number;
  cols: number;
  areas: Area[];
  /** Optional board-level background CSS (multiline string of background-* declarations). */
  background?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @deprecated UserDoc interface removed - CardMass now uses SSO for all user management
 * Users are managed in the SSO system, not in CardMass database
 */

/** Page password record to guard specific pages. WHAT: Per-page access token. WHY: Zero-trust rule requires valid token for non-admin viewers. */
export interface PagePasswordDoc {
  _id?: import('mongodb').ObjectId;
  pageId: string; // e.g., boardUUID
  pageType: 'tagger' | 'stats' | 'edit' | 'filter';
  /** 32-lowercase-hex string (MD5-style token). */
  password: string;
  /** ISO 8601 with milliseconds, UTC */
  createdAt: string;
  /** incremented on successful validation */
  usageCount: number;
  /** ISO 8601 with milliseconds, UTC (optional) */
  lastUsedAt?: string;
  /** Optional expiration timestamp (ISO 8601 with ms, UTC) */
  expiresAt?: string;
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
   * Per-board placements: mapping from board UUID -> canonical area label on that board.
   * Why: Enables N-dimensional classification; spock is never persisted (empty mapping implies spock fallback where available).
   * Keys MUST be valid UUID v4 (board.uuid), NOT board slugs.
   */
  boardAreas?: Record<string, string>
  /**
   * Hide card from all interactive listings without deleting it.
   * Why: Archive keeps data for future reference or sharing while removing it from day-to-day flows.
   */
  isArchived?: boolean;
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
  /** Per-board placements keyed by board UUID (v4), not slug */
  boardAreas?: Record<string, string>;
  isArchived?: boolean;
}
