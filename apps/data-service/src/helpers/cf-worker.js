export default {
	async fetch(request, env, ctx) {
		let { pathname, search, host } = new URL(request.url);
		const domain = 'analytics.dalilk.com';
		let newRequest = new Request(`https://${domain}${pathname}${search}`, request);
		newRequest.headers.set('Host', domain);
        console.log('newRequest', newRequest);
		return fetch(newRequest);
	},
};
