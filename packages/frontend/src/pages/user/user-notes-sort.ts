/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PaginationOrderOption } from '@/components/MkPaginationControl.vue';
import { i18n } from '@/i18n.js';

export type UserNotesSortOrder = 'newest' | 'oldest' | 'renoteCount' | 'reactionCount';

export const userNotesOrderOptions = [
	{ label: i18n.ts._order.newest, value: 'newest', paginatorOrder: 'newest', initialDirection: 'older' },
	{ label: i18n.ts._order.oldest, value: 'oldest', paginatorOrder: 'oldest', initialDirection: 'newer' },
	{ label: i18n.ts._order.mostRenoted, value: 'renoteCount', paginatorOrder: 'newest', initialDirection: 'older', supportsDate: false },
	{ label: i18n.ts._order.mostReacted, value: 'reactionCount', paginatorOrder: 'newest', initialDirection: 'older', supportsDate: false },
] satisfies PaginationOrderOption[];

export function getUserNotesSortBy(order: UserNotesSortOrder): 'renoteCount' | 'reactionCount' | undefined {
	return order === 'renoteCount' || order === 'reactionCount' ? order : undefined;
}

export function getUserNotesCursorParams(note: { sortScore?: number }, direction: 'newer' | 'older') {
	if (note.sortScore == null) return {};
	return direction === 'older' ? { untilScore: note.sortScore } : { sinceScore: note.sortScore };
}

export function isChronologicalUserNotesOrder(order: UserNotesSortOrder): boolean {
	return order === 'newest' || order === 'oldest';
}
