import Vue from 'vue';

Vue.filter('append', (x: string) => x ? ' ' + x : x);
