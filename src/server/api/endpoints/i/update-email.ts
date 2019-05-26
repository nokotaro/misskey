import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';
import * as nodemailer from 'nodemailer';
import fetchMeta from '../../../../misc/fetch-meta';
import rndstr from 'rndstr';
import config from '../../../../config';
import * as ms from 'ms';
import * as bcrypt from 'bcryptjs';
import { apiLogger } from '../../logger';
import smime from '../../../../misc/smime';
import email from '../../../../misc/email';

export const meta = {
	requireCredential: true,

	secure: true,

	limit: {
		duration: ms('1hour'),
		max: 3
	},

	params: {
		password: {
			validator: $.str
		},

		email: {
			validator: $.optional.nullable.str
		},
	}
};

export default define(meta, async (ps, user) => {
	// Compare password
	const same = await bcrypt.compare(ps.password, user.password);

	if (!same) {
		throw new Error('incorrect password');
	}

	await User.update(user._id, {
		$set: {
			email: ps.email,
			emailVerified: false,
			emailVerifyCode: null
		}
	});

	const iObj = await pack(user._id, user, {
		detail: true,
		includeSecrets: true
	});

	// Publish meUpdated event
	publishMainStream(user._id, 'meUpdated', iObj);

	if (ps.email) {
		const code = rndstr('a-z0-9', 64);

		await User.update(user._id, {
			$set: {
				emailVerifyCode: code
			}
		});

		const link = `${config.url}/verify-email/${code}`;

		const meta = await fetchMeta();

		const enableAuth = meta.smtpUser && meta.smtpUser.length;

		const transporter = nodemailer.createTransport({
			host: meta.smtpHost,
			port: meta.smtpPort,
			secure: meta.smtpSecure,
			ignoreTLS: !enableAuth,
			auth: enableAuth ? {
				user: meta.smtpUser,
				pass: meta.smtpPass
			} : undefined
		});

		// transporter.use('stream', smime);

		transporter.sendMail({
			from: meta.email,
			to: ps.email,
			subject: meta.name,
			html: email('verify', user.username, link)
		}, (error, info) => {
			if (error) {
				apiLogger.error(error);
				return;
			}

			apiLogger.info('Message sent: %s', info.messageId);
		});
	}

	return iObj;
});
