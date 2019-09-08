<template>
<mfm class="sakura" :text="user.name || user.username" :plain="true" :nowrap="true" :custom-emojis="user.emojis"/>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		user: {
			type: Object,
			required: true
		}
	}
});
</script>

<style lang="stylus" scoped>
.sakura
	font-family fot-rodin-pron, a-otf-ud-shin-go-pr6n, sans-serif
	font-weight 600
	line-height 1
</style>
