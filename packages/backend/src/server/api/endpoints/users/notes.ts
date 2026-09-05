/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { MiMeta, MiNote, NoteReactionsRepository, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { CacheService } from '@/core/CacheService.js';
import { IdService } from '@/core/IdService.js';
import { QueryService } from '@/core/QueryService.js';
import { MiLocalUser } from '@/models/User.js';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';
import { FanoutTimelineName } from '@/core/FanoutTimelineService.js';
import { ApiError } from '@/server/api/error.js';
import { ChannelMutingService } from '@/core/ChannelMutingService.js';

type NoteWithSortScore = MiNote & { _sortScore?: number };

export const meta = {
	tags: ['users', 'notes'],
	limit: {
		duration: 60 * 1000,
		max: 120,
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			allOf: [
				{
					type: 'object',
					ref: 'Note',
				},
				{
					type: 'object',
					properties: {
						sortScore: {
							type: 'integer',
							optional: true, nullable: false,
						},
					},
				},
			],
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27e494ba-2ac2-48e8-893b-10d4d8c2387b',
		},

		bothWithRepliesAndWithFiles: {
			message: 'Specifying both withReplies and withFiles is not supported',
			code: 'BOTH_WITH_REPLIES_AND_WITH_FILES',
			id: '91c8cb9f-36ed-46e7-9ca2-7df96ed6e222',
		},

		signinRequired: {
			message: 'Signin required.',
			code: 'SIGNIN_REQUIRED',
			id: 'd1588a9e-4b4d-4c07-807f-16f1486577a2',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		withReplies: { type: 'boolean', default: false },
		withRenotes: { type: 'boolean', default: true },
		withChannelNotes: { type: 'boolean', default: false },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		sinceScore: { type: 'integer', minimum: 0 },
		untilScore: { type: 'integer', minimum: 0 },
		allowPartial: { type: 'boolean', default: false }, // true is recommended but for compatibility false by default
		withFiles: { type: 'boolean', default: false },
		sortBy: { type: 'string', enum: ['renoteCount', 'reactionCount'] },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private cacheService: CacheService,
		private idService: IdService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
		private channelMutingService: ChannelMutingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.sortBy == null && ps.untilDate ? this.idService.gen(ps.untilDate) : null);
			const sinceId = ps.sinceId ?? (ps.sortBy == null && ps.sinceDate ? this.idService.gen(ps.sinceDate) : null);
			const isSelf = me && (me.id === ps.userId);

			if (ps.withReplies && ps.withFiles) throw new ApiError(meta.errors.bothWithRepliesAndWithFiles);

			// early return if me is blocked by requesting user
			if (me != null) {
				const userIdsWhoBlockingMe = await this.cacheService.userBlockedCache.fetch(me.id);
				if (userIdsWhoBlockingMe.has(ps.userId)) {
					return [];
				}
			}

			const dbQueryOptions = {
				userId: ps.userId,
				withChannelNotes: ps.withChannelNotes,
				withFiles: ps.withFiles,
				withRenotes: ps.withRenotes,
				withReplies: ps.withReplies,
				sortBy: ps.sortBy,
				sinceDate: ps.sinceDate,
				untilDate: ps.untilDate,
				sinceScore: ps.sinceScore,
				untilScore: ps.untilScore,
			};

			if (!this.serverSettings.enableFanoutTimeline || ps.sortBy != null) {
				const timeline = await this.getFromDb({
					...dbQueryOptions,
					untilId,
					sinceId,
					limit: ps.limit,
				}, me);

				const packed = await this.noteEntityService.packMany(timeline, me);
				return ps.sortBy == null
					? packed
					: packed.map((note, index) => ({
						...note,
						sortScore: timeline[index]._sortScore!,
					}));
			}

			const redisTimelines: FanoutTimelineName[] = [ps.withFiles ? `userTimelineWithFiles:${ps.userId}` : `userTimeline:${ps.userId}`];

			if (ps.withReplies) redisTimelines.push(`userTimelineWithReplies:${ps.userId}`);
			if (ps.withChannelNotes) redisTimelines.push(`userTimelineWithChannel:${ps.userId}`);

			const isFollowing = me && Object.hasOwn(await this.cacheService.userFollowingsCache.fetch(me.id), ps.userId);

			const timeline = await this.fanoutTimelineEndpointService.timeline({
				untilId,
				sinceId,
				limit: ps.limit,
				allowPartial: ps.allowPartial,
				me,
				redisTimelines,
				useDbFallback: true,
				ignoreAuthorFromMute: true,
				ignoreAuthorFromInstanceBlock: true,
				ignoreAuthorFromUserSuspension: true,
				excludeReplies: ps.withChannelNotes && !ps.withReplies, // userTimelineWithChannel may include replies
				excludeNoFiles: ps.withChannelNotes && ps.withFiles, // userTimelineWithChannel may include notes without files
				excludePureRenotes: !ps.withRenotes,
				noteFilter: note => {
					if (note.channel?.isSensitive && !isSelf) return false;
					if (note.visibility === 'specified' && (!me || (me.id !== note.userId && !note.visibleUserIds.some(v => v === me.id)))) return false;
					if (note.visibility === 'followers' && !isFollowing && !isSelf) return false;

					return true;
				},
				dbFallback: async (untilId, sinceId, limit) => await this.getFromDb({
					...dbQueryOptions,
					untilId,
					sinceId,
					limit,
				}, me),
			});

			return timeline;
		});
	}

	private async getFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		userId: string,
		withChannelNotes: boolean,
		withFiles: boolean,
		withRenotes: boolean,
		withReplies: boolean,
		sortBy?: 'renoteCount' | 'reactionCount',
		sinceDate?: number,
		untilDate?: number,
		sinceScore?: number,
		untilScore?: number,
	}, me: MiLocalUser | null): Promise<NoteWithSortScore[]> {
		const mutingChannelIds = me
			? await this.channelMutingService
				.list({ requestUserId: me.id }, { idOnly: true })
				.then(x => x.map(x => x.id))
			: [];
		const isSelf = me && (me.id === ps.userId);

		const query = this.notesRepository.createQueryBuilder('note')
			.andWhere('note.userId = :userId', { userId: ps.userId })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('note.channel', 'channel')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		if (ps.sortBy == null) {
			this.queryService.makePaginationQuery(query, ps.sinceId, ps.untilId);
		} else {
			const scoreExpression = ps.sortBy === 'renoteCount'
				? 'note.renoteCount'
				: '(SELECT COUNT(*) FROM note_reaction reaction WHERE reaction."noteId" = note.id)';
			if (ps.sortBy === 'reactionCount') {
				query.addSelect(scoreExpression, 'note_sortScore');
			}
			const [sinceCursorScore, untilCursorScore] = await Promise.all([
				ps.sinceId && ps.sinceScore == null ? this.getCursorScore(ps.sinceId, ps.sortBy) : null,
				ps.untilId && ps.untilScore == null ? this.getCursorScore(ps.untilId, ps.sortBy) : null,
			]);

			if (ps.sinceDate) query.andWhere('note.id > :sinceDateId', { sinceDateId: this.idService.gen(ps.sinceDate) });
			if (ps.untilDate) query.andWhere('note.id < :untilDateId', { untilDateId: this.idService.gen(ps.untilDate) });

			if (ps.sinceId) {
				const sinceScore = ps.sinceScore ?? sinceCursorScore;
				if (sinceScore == null) {
					query.andWhere('FALSE');
				} else {
					query.andWhere(new Brackets(qb => {
						qb.where(`${scoreExpression} > :sinceScore`, { sinceScore });
						qb.orWhere(`(${scoreExpression} = :sinceScore AND note.id > :sinceId)`, { sinceScore, sinceId: ps.sinceId });
					}));
				}
			}

			if (ps.untilId) {
				const untilScore = ps.untilScore ?? untilCursorScore;
				if (untilScore == null) {
					query.andWhere('FALSE');
				} else {
					query.andWhere(new Brackets(qb => {
						qb.where(`${scoreExpression} < :untilScore`, { untilScore });
						qb.orWhere(`(${scoreExpression} = :untilScore AND note.id < :untilId)`, { untilScore, untilId: ps.untilId });
					}));
				}
			}

			const direction = ps.sinceId && !ps.untilId ? 'ASC' : 'DESC';
			query.orderBy(scoreExpression, direction).addOrderBy('note.id', direction);
		}

		if (!ps.withReplies) {
			query.andWhere(new Brackets(qb => {
				qb
					.where('note.replyId IS NULL')
					.orWhere(new Brackets(qb => {
						qb
							.where('note.replyId IS NOT NULL')
							.andWhere('note.replyUserId = note.userId');
					}));
			}));
		}

		if (ps.withChannelNotes) {
			query.andWhere(new Brackets(qb => {
				if (mutingChannelIds.length > 0) {
					qb.andWhere(new Brackets(qb2 => {
						qb2.orWhere('note.channelId IS NULL');
						qb2.orWhere('note.channelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
					}));
				}

				if (!isSelf) {
					qb.andWhere(new Brackets(qb2 => {
						qb2.orWhere('note.channelId IS NULL');
						qb2.orWhere('channel.isSensitive = false');
					}));
				}
			}));
		} else {
			query.andWhere('note.channelId IS NULL');
		}

		// -- ミュートされたチャンネルのリノート対策
		if (mutingChannelIds.length > 0) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteChannelId IS NULL');
				qb.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
			}));
		}

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me, {
			excludeAuthor: true,
			excludeUserFromMute: ps.userId,
		});

		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}

		if (ps.withRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.userId != :userId', { userId: ps.userId });
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere('note.text IS NOT NULL');
				qb.orWhere('note.fileIds != \'{}\'');
				qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
			}));
		}

		query.limit(ps.limit);
		if (ps.sortBy == null) return await query.getMany();

		const { entities, raw } = await query.getRawAndEntities();
		return entities.map((note, index): NoteWithSortScore => Object.assign(note, {
			_sortScore: ps.sortBy === 'renoteCount'
				? note.renoteCount
				: Number(raw[index].note_sortScore),
		}));
	}

	private async getCursorScore(noteId: string, sortBy: 'renoteCount' | 'reactionCount'): Promise<number | null> {
		if (sortBy === 'reactionCount') {
			return await this.noteReactionsRepository.countBy({ noteId });
		}

		const note = await this.notesRepository.findOne({
			select: { renoteCount: true },
			where: { id: noteId },
		});
		return note?.renoteCount ?? null;
	}
}
