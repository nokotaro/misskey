import Particle from '../components/particle.vue';

export default {
	bind(el, binding, vn) {
		if (!binding.value || vn.context.$store.state.device.reduceMotion) return;

		const z = binding.arg;

		console.log(el, binding, vn, z);

		el.addEventListener('click', () => {
			if (binding.value === false) return;

			const rect = el.getBoundingClientRect();

			const x = rect.left + (el.clientWidth / 2);
			const y = rect.top + (el.clientHeight / 2);

			const particle = new Particle({
				parent: vn.context,
				propsData: { x, y, z }
			}).$mount();

			document.body.appendChild(particle.$el);
		});
	}
};
