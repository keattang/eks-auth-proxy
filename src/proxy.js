const proxy = require('koa-better-http-proxy');
const { proxyHost, proxyUseHttps, proxyPreserveHost } = require('./config');

module.exports = proxy(proxyHost, {
    https: proxyUseHttps,
    preserveHostHdr: proxyPreserveHost,
    proxyReqOptDecorator: (options, ctx) => {
        const optionsCopy = { ...options };

        if (ctx.state.user) {
            const { eksToken } = ctx.state.user;
            optionsCopy.headers.Authorization = `Bearer ${eksToken.token}`;
        }

        return optionsCopy;
    },
});
