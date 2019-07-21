<template>
<div style="position:initial">
	<mk-menu :source="source" :items="items" @closed="closed"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';
import { faCopy, faEye, faEyeSlash, faPlaneArrival, faPlaneDeparture } from '@fortawesome/pro-light-svg-icons';
import { query } from '../../../../../prelude/url';

export default Vue.extend({
	i18n: i18n('common/views/components/note-menu.vue'),
	props: ['note', 'source'],
	data() {
		return {
			isFavorited: false,
			isWatching: false
		};
	},
	computed: {
		items(): any[] {
			return [{
				icon: ['fal', 'at'],
				text: this.$t('mention'),
				action: this.mention
			}, null, {
				icon: ['fal', 'info-circle'],
				text: this.$t('detail'),
				action: this.detail
			}, {
				icon: faPlaneArrival,
				text: this.$t('go-timeline'),
				action: this.goTimeline
			}, {
				icon: faPlaneDeparture,
				text: this.$t('up-timeline'),
				action: this.upTimeline
			}, {
				icon: faCopy,
				text: this.$t('copy-content'),
				action: this.copyContent
			}, {
				icon: ['fal', 'link'],
				text: this.$t('copy-link'),
				action: this.copyLink
			}, this.note.uri ? {
				icon: ['fal', 'external-link-square-alt'],
				text: this.$t('remote'),
				action: () => {
					window.open(this.note.uri, '_blank');
				}
			} : undefined, {
				icon: ['fal', 'layer-group'],
				text: this.$t('copy-notestock-link'),
				action: this.notestock
			},
			null,
			this.isFavorited ? {
				icon: ['fal', 'star'],
				text: this.$t('unfavorite'),
				action: () => this.toggleFavorite(false)
			} : {
				icon: ['fal', 'star'],
				text: this.$t('favorite'),
				action: () => this.toggleFavorite(true)
			},
			this.note.userId != this.$store.state.i.id ? this.isWatching ? {
				icon: faEyeSlash,
				text: this.$t('unwatch'),
				action: () => this.toggleWatch(false)
			} : {
				icon: faEye,
				text: this.$t('watch'),
				action: () => this.toggleWatch(true)
			} : undefined,
			this.note.userId == this.$store.state.i.id && (this.$store.state.i.pinnedNoteIds || []).includes(this.note.id) ? {
				icon: ['fal', 'thumbtack'],
				text: this.$t('unpin'),
				action: () => this.togglePin(false)
			} : undefined,
			this.pinnable ? {
				icon: ['fal', 'thumbtack'],
				text: this.$t('pin'),
				action: () => this.togglePin(true)
			} : undefined,
			...(this.note.userId == this.$store.state.i.id || this.$store.state.i.isAdmin || this.$store.state.i.isModerator ? [
				null, {
					icon: ['fal', 'trash-alt'],
					text: this.$t('delete'),
					action: this.del
				}]
				: []
			)]
			.filter(x => x !== undefined)
		},

		pinnable(): boolean {
			return this.note.userId == this.$store.state.i.id
				&& !(this.$store.state.i.pinnedNoteIds || []).includes(this.note.id)
				&& (this.note.visibility == 'public' || this.note.visibility == 'home')
				&& !this.note.localOnly;
		},
	},

	created() {
		this.$root.api('notes/state', {
			noteId: this.note.id
		}).then(state => {
			this.isFavorited = state.isFavorited;
			this.isWatching = state.isWatching;
		});
	},

	methods: {
		mention() {
			this.$post({ mention: this.note.user });
		},

		detail() {
			this.$router.push(`/notes/${this.note.id}`);
		},

		async copyContent() {
			try {
				await copyToClipboard(this.note.text);
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			} catch (e) {
				this.$root.dialog({
					type: 'error',
					text: e
				})
			}
		},

		async copyLink() {
			try {
				await copyToClipboard(`${url}/notes/${this.note.id}`);
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			} catch (e) {
				this.$root.dialog({
					type: 'error',
					text: e
				})
			}
		},

		async notestock() {
			try {
				const response = await fetch(`https://notestock.osa-p.net/api/v1/isstock.json?${query({ id: this.note.uri || `${url}/notes/${this.note.id}` })}`);
				const json = await response.json();
				if (!(json && typeof json === 'object' && json.note && typeof json.note === 'object')) {
					throw JSON.stringify(json);
				}
				const noteUrl = json.note.full_url || json.note.url;
				if (typeof noteUrl !== 'string') {
					throw '404 - stock not found';
				}
				await copyToClipboard(noteUrl);
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			} catch (e) {
				this.$root.dialog({
					type: 'error',
					text: e
				})
			}
		},

		togglePin(pin: boolean) {
			this.$root.api(pin ? 'i/pin' : 'i/unpin', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.destroyDom();
			}).catch(e => {
				if (e.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
					this.$root.dialog({
						type: 'error',
						text: this.$t('pin-limit-exceeded')
					});
				}
			});
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('delete-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('notes/delete', {
					noteId: this.note.id
				}).then(() => {
					this.destroyDom();
				});
			});
		},

		toggleFavorite(favorite: boolean) {
			this.$root.api(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.destroyDom();
			});
		},

		toggleWatch(watch: boolean) {
			this.$root.api(watch ? 'notes/watching/create' : 'notes/watching/delete', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.destroyDom();
			});
		},

		goTimeline() {
			const date = new Date(new Date(this.note.createdAt).getTime() + 5000).toISOString();
			const host = this.note.user.host || '.';
			const q = `host:${host} until:${date}`;

			this.$router.push(`/search?q=${encodeURIComponent(q)}`);
		},

		upTimeline() {
			const date = new Date(new Date(this.note.createdAt).getTime() - 5000).toISOString();
			const host = this.note.user.host || '.';
			const q = `host:${host} since:${date}`;

			this.$router.push(`/search?q=${encodeURIComponent(q)}`);
		},

		closed() {
			this.$nextTick(() => {
				this.destroyDom();
			});
		}
	}
});
</script>
