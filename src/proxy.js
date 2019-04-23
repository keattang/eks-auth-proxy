const httpProxy = require('http-proxy');
const { proxyHost, proxyUseHttps, proxyPreserveHost } = require('./config');
const log = require('./logger');
const { getProxyReqHeaders } = require('./utilities');

const proxyProtocol = proxyUseHttps ? 'https' : 'http';
const proxyTarget = `${proxyProtocol}://${proxyHost}`;

log.info(`Proxying requests to ${proxyTarget}`);

const proxy = httpProxy.createProxyServer({
    target: proxyTarget,
    xfwd: true,
    secure: true,
    changeOrigin: !proxyPreserveHost,
});

// Alter the outgoing proxy request to add the Authroization header
proxy.on('proxyReq', (proxyReq, req) => {
    if (!req.user) {
        return;
    }
    const { eksToken } = req.user;
    proxyReq.setHeader('Authorization', `Bearer ${eksToken.token}`);

    log.debug(
        `Upstream request headers: ${JSON.stringify(
            getProxyReqHeaders(proxyReq)
        )}`
    );
});

const proxyMiddleware = ctx => {
    ctx.respond = false; // Required to prevent koa from sending out headers
    proxy.web(ctx.req, ctx.res);
};

const proxyWebSocket = (req, socket, head) => proxy.ws(req, socket, head);

module.exports = {
    proxy,
    proxyMiddleware,
    proxyWebSocket,
};
