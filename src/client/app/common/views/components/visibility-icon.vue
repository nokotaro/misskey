<template>
	<div>
		<div class="wrap" v-if="visibility == 'public'">
			<fa :icon="['fal', 'globe']" :fixed-width="fixedWidth"/>
		</div>
		<div class="wrap" v-else-if="visibility == 'home'">
			<fa :icon="['fal', 'home']" :fixed-width="fixedWidth"/>
		</div>
		<div class="wrap" v-else-if="visibility == 'followers'">
			<fa :icon="['fal', 'lock-alt']" :fixed-width="fixedWidth"/>
		</div>
		<div class="wrap" v-else-if="visibility == 'specified'">
			<fa :icon="['fal', 'envelope']" :fixed-width="fixedWidth"/>
		</div>
		<div class="wrap" v-else-if="visibility == 'local-public'">
			<div><fa :icon="['fal', 'globe']" :fixed-width="fixedWidth"/></div>
			<div class="local-only" :class="{ 'alt-color': altColor }"><fa :icon="['fal', 'shield-alt']" :fixed-width="fixedWidth"/></div>
		</div>
		<div class="wrap" v-else-if="visibility == 'local-home'">
			<div><fa :icon="['fal', 'home']" :fixed-width="fixedWidth"/></div>
			<div class="local-only" :class="{ 'alt-color': altColor }"><fa :icon="['fal', 'shield-alt']" :fixed-width="fixedWidth"/></div>
		</div>
		<div class="wrap" v-else-if="visibility == 'local-followers'">
			<div><fa :icon="['fal', 'lock-alt']" :fixed-width="fixedWidth"/></div>
			<div class="local-only" :class="{ 'alt-color': altColor }"><fa :icon="['fal', 'shield-alt']" :fixed-width="fixedWidth"/></div>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		v: {
			type: String,
			required: true
		},
		localOnly: {
			type: Boolean,
			required: false,
			default: false
		},
		fixedWidth: {
			type: Boolean,
			required: false,
			default: false
		},
		altColor: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	computed: {
		visibility(): string {
			return this.localOnly ? `local-${this.v}` : this.v;
		},
	},
});
</script>

<style lang="stylus" scoped>
	.wrap
		display inline-block

		> .local-only
			color var(--primary)
			position absolute
			top -.375em
			right -.5em
			transform scale(0.8)

			&.alt-color
				color var(--text)
</style>
