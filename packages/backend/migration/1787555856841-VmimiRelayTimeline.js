/*
 * SPDX-FileCopyrightText: anatawa12 and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class VmimiRelayTimeline1787555856841 {
    name = 'VmimiRelayTimeline1787555856841'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "vmimiRelayTimelineCacheMax" integer NOT NULL DEFAULT '300'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "vmimiRelayTimelineCacheMax"`);
    }
}
