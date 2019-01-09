const proxy = require('koa-better-http-proxy');
const {
    proxyHost,
    proxyUseHttps,
    proxyPreserveHost,
    loginUrl,
} = require('./config');
const log = require('./logger');

module.exports = proxy(proxyHost, {
    https: proxyUseHttps,
    preserveHostHdr: proxyPreserveHost,
    filter: ctx => !ctx.path.startsWith(loginUrl),
    proxyReqOptDecorator: (options, ctx) => {
        const optionsCopy = { ...options };

        if (ctx.state.user) {
            const { eksToken } = ctx.state.user;
            optionsCopy.headers.Authorization = `Bearer ${eksToken.token}`;

            log.debug(
                `Upstream request headers: ${JSON.stringify(
                    optionsCopy.headers
                )}`
            );
        }

        return optionsCopy;
    },
});
