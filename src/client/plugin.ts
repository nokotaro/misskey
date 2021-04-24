import { AiScript, utils, values } from '@syuilo/aiscript';
import { deserialize } from '@syuilo/aiscript/built/serializer';
import { jsToVal } from '@syuilo/aiscript/built/interpreter/util';
import { createAiScriptEnv } from '@client/scripts/aiscript/api';
import { dialog } from '@client/os';
import { noteActions, notePostInterruptors, noteViewInterruptors, postFormActions, userActions } from '@client/store';

const pluginContexts = new Map<string, AiScript>();

export function install(plugin) {
	console.info('Plugin installed:', plugin.name, 'v' + plugin.version);

	const aiscript = new AiScript(createPluginEnv({
		plugin: plugin,
		storageKey: 'plugins:' + plugin.id
	}), {
		in: (q) => {
			return new Promise(ok => {
				dialog({
					title: q,
					input: {}
				}).then(({ canceled, result: a }) => {
					ok(a);
				});
			});
		},
		out: (value) => {
			console.log(value);
		},
		log: (type, params) => {
		},
	});

	initPlugin({ plugin, aiscript });

	aiscript.exec(deserialize(plugin.ast));
}

function createPluginEnv(opts) {
	const config = new Map();
	for (const [k, v] of Object.entries(opts.plugin.config || {})) {
		config.set(k, jsToVal(opts.plugin.configData.hasOwnProperty(k) ? opts.plugin.configData[k] : v.default));
	}

	return {
		...createAiScriptEnv({ ...opts, token: opts.plugin.token }),
		//#region Deprecated
		'Mk:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			registerPostFormAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_user_action': values.FN_NATIVE(([title, handler]) => {
			registerUserAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_note_action': values.FN_NATIVE(([title, handler]) => {
			registerNoteAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		//#endregion
		'Plugin:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			registerPostFormAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_user_action': values.FN_NATIVE(([title, handler]) => {
			registerUserAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_action': values.FN_NATIVE(([title, handler]) => {
			registerNoteAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_view_interruptor': values.FN_NATIVE(([handler]) => {
			registerNoteViewInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:register_note_post_interruptor': values.FN_NATIVE(([handler]) => {
			registerNotePostInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:open_url': values.FN_NATIVE(([url]) => {
			window.open(url.value, '_blank');
		}),
		'Plugin:config': values.OBJ(config),
	};
}

function initPlugin({ plugin, aiscript }) {
	pluginContexts.set(plugin.id, aiscript);
}

function registerPostFormAction({ pluginId, title, handler }) {
	postFormActions.push({
		title, handler: (form, update) => {
			pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(form), values.FN_NATIVE(([key, value]) => {
				update(key.value, value.value);
			})]);
		}
	});
}

function registerUserAction({ pluginId, title, handler }) {
	userActions.push({
		title, handler: (user) => {
			pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(user)]);
		}
	});
}

function registerNoteAction({ pluginId, title, handler }) {
	noteActions.push({
		title, handler: (note) => {
			pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]);
		}
	});
}

function registerNoteViewInterruptor({ pluginId, handler }) {
	noteViewInterruptors.push({
		handler: async (note) => {
			return utils.valToJs(await pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]));
		}
	});
}

function registerNotePostInterruptor({ pluginId, handler }) {
	notePostInterruptors.push({
		handler: async (note) => {
			return utils.valToJs(await pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]));
		}
	});
}
