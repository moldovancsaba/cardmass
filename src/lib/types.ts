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
 * Admin user document (stored in MongoDB)
 * WHAT: Represents a user with authentication credentials and organization access
 * WHY: Enables multi-tenant access control with role-based permissions
 */
export interface UserDoc {
  _id?: import('mongodb').ObjectId;
  email: string;
  name: string;
  /** Global role: 'super-admin' (all orgs), 'user' (specific orgs only) */
  role: 'user' | 'super-admin';
  /** Per project convention: MD5-hashed password */
  password: string;
  /**
   * Organization access control
   * Array of { orgUUID, role } where role is 'org-admin' or 'member'
   * - org-admin: Can manage users, boards, and passwords within the org
   * - member: Can view and work on boards they have access to
   * Empty array or missing = no org access (super-admin bypasses this)
   */
  organizationAccess?: Array<{
    organizationUUID: string;
    role: 'org-admin' | 'member';
  }>;
  /** ISO 8601 with milliseconds, UTC */
  createdAt: string;
  /** ISO 8601 with milliseconds, UTC */
  updatedAt: string;
}

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
   * Per-board placements: mapping from board slug -> canonical area label on that board.
   * Why: Enables N-dimensional classification; spock is never persisted (empty mapping implies spock fallback where available).
   */
  boardAreas?: Record<string, string>;
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
  boardAreas?: Record<string, string>;
  isArchived?: boolean;
}
