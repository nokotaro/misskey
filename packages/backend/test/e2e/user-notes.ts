/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { beforeAll, describe, test, vi } from 'vitest';
import { api, post, react, signup, uploadUrl } from '../utils.js';
import type * as misskey from 'misskey-js';

const waitForPushToTlOptions = { timeout: 3000, interval: 25 };

describe('users/notes', () => {
	let alice: misskey.entities.SignupResponse;
	let jpgNote: misskey.entities.Note;
	let pngNote: misskey.entities.Note;
	let jpgPngNote: misskey.entities.Note;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		const jpg = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/192.jpg');
		const png = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/192.png');
		jpgNote = await post(alice, {
			fileIds: [jpg.id],
		});
		pngNote = await post(alice, {
			fileIds: [png.id],
		});
		jpgPngNote = await post(alice, {
			fileIds: [jpg.id, png.id],
		});
	}, 1000 * 60 * 2);

	test('withFiles', async () => {
		await vi.waitFor(async () => {
			const res = await api('users/notes', {
				userId: alice.id,
				withFiles: true,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 3);
			assert.strictEqual(res.body.some((note: any) => note.id === jpgNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === pngNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === jpgPngNote.id), true);
		}, waitForPushToTlOptions);
	});

	test('sortBy reactionCount', async () => {
		const bob = await signup({ username: 'bob' });
		const carol = await signup({ username: 'carol' });
		const lessReactedNote = await post(alice, { text: 'one reaction' });
		const moreReactedNote = await post(alice, { text: 'two reactions' });
		const equallyReactedNote = await post(alice, { text: 'two reactions, newer' });
		await react(bob, lessReactedNote, '👍');
		await react(bob, moreReactedNote, '👍');
		await react(carol, moreReactedNote, '👍');
		await react(bob, equallyReactedNote, '👍');
		await react(carol, equallyReactedNote, '👍');

		await vi.waitFor(async () => {
			const firstPage = await api('users/notes', {
				userId: alice.id,
				sortBy: 'reactionCount',
				limit: 1,
			}, alice);
			const secondPage = await api('users/notes', {
				userId: alice.id,
				sortBy: 'reactionCount',
				untilId: firstPage.body[0].id,
				untilScore: firstPage.body[0].sortScore,
				limit: 1,
			}, alice);
			const thirdPage = await api('users/notes', {
				userId: alice.id,
				sortBy: 'reactionCount',
				untilId: secondPage.body[0].id,
				untilScore: secondPage.body[0].sortScore,
				limit: 1,
			}, alice);

			assert.strictEqual(firstPage.status, 200);
			assert.strictEqual(secondPage.status, 200);
			assert.strictEqual(thirdPage.status, 200);
			assert.deepStrictEqual([...firstPage.body, ...secondPage.body, ...thirdPage.body].map(note => note.id), [equallyReactedNote.id, moreReactedNote.id, lessReactedNote.id]);
		}, waitForPushToTlOptions);
	});

	test('sortBy renoteCount', async () => {
		const dave = await signup({ username: 'dave' });
		const erin = await signup({ username: 'erin' });
		const lessRenotedNote = await post(alice, { text: 'one renote' });
		const moreRenotedNote = await post(alice, { text: 'two renotes' });
		const equallyRenotedNote = await post(alice, { text: 'two renotes, newer' });
		await post(dave, { renoteId: lessRenotedNote.id });
		await post(dave, { renoteId: moreRenotedNote.id });
		await post(erin, { renoteId: moreRenotedNote.id });
		await post(dave, { renoteId: equallyRenotedNote.id });
		await post(erin, { renoteId: equallyRenotedNote.id });

		await vi.waitFor(async () => {
			const firstPage = await api('users/notes', {
				userId: alice.id,
				sortBy: 'renoteCount',
				limit: 1,
			}, alice);
			const secondPage = await api('users/notes', {
				userId: alice.id,
				sortBy: 'renoteCount',
				untilId: firstPage.body[0].id,
				untilScore: firstPage.body[0].sortScore,
				limit: 1,
			}, alice);
			const thirdPage = await api('users/notes', {
				userId: alice.id,
				sortBy: 'renoteCount',
				untilId: secondPage.body[0].id,
				untilScore: secondPage.body[0].sortScore,
				limit: 1,
			}, alice);

			assert.strictEqual(firstPage.status, 200);
			assert.strictEqual(secondPage.status, 200);
			assert.strictEqual(thirdPage.status, 200);
			assert.deepStrictEqual([...firstPage.body, ...secondPage.body, ...thirdPage.body].map(note => note.id), [equallyRenotedNote.id, moreRenotedNote.id, lessRenotedNote.id]);
		}, waitForPushToTlOptions);
	});

	test('sortBy respects withReplies and date filters', async () => {
		const bob = await signup({ username: 'frank' });
		const rootNote = await post(bob, { text: 'root' });
		const reply = await post(alice, { text: 'reply', replyId: rootNote.id });
		const selfReplyRoot = await post(alice, { text: 'self reply root' });
		const selfReply = await post(alice, { text: 'self reply', replyId: selfReplyRoot.id });
		await react(bob, reply, '👍');
		await react(bob, selfReply, '👍');

		const withoutReplies = await api('users/notes', {
			userId: alice.id,
			sortBy: 'reactionCount',
			withReplies: false,
			untilDate: Date.now() + 60_000,
			limit: 100,
		}, alice);
		const withReplies = await api('users/notes', {
			userId: alice.id,
			sortBy: 'reactionCount',
			withReplies: true,
			untilDate: Date.now() + 60_000,
			limit: 100,
		}, alice);

		assert.strictEqual(withoutReplies.status, 200);
		assert.strictEqual(withReplies.status, 200);
		assert.strictEqual(withoutReplies.body.some(note => note.id === reply.id), false);
		assert.strictEqual(withoutReplies.body.some(note => note.id === selfReply.id), true);
		assert.strictEqual(withReplies.body.some(note => note.id === reply.id), true);
	});
});
