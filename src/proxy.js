const httpProxy = require('http-proxy');
const {
    proxyHost,
    proxyUseHttps,
    proxyPreserveHost,
    proxyForwardUserAttr
} = require('./config');

const log = require('./logger');

const proxyProtocol = proxyUseHttps ? 'https' : 'http';
const proxyTarget = `${proxyProtocol}://${proxyHost}`;

log.info(`Proxying requests to ${proxyTarget}`);

// Based on example posted here
// https://github.com/nodejitsu/node-http-proxy/issues/1156
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

    proxyForwardUserAttr.forEach(item => {
        const parsed = JSON.parse(item);
        const forwardHeaderName = Object.keys(parsed)[0];
        const mappedUserAttr = parsed[forwardHeaderName];
        proxyReq.setHeader(forwardHeaderName, req.user[mappedUserAttr]);
    });

    log.debug(
        `Upstream request headers: ${JSON.stringify(proxyReq.getHeaders())}`
    );
});

// Log errors
proxy.on('error', log.error.bind(log));

const proxyMiddleware = (ctx) => {
    ctx.respond = false; // Required to prevent koa from sending out headers
    proxy.web(ctx.req, ctx.res);
};

const proxyWebSocket = (req, socket, head) => proxy.ws(req, socket, head);

module.exports = {
    proxy,
    proxyMiddleware,
    proxyWebSocket,
};
