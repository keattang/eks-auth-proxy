require('dotenv').config();

const Koa = require('koa');
const session = require('koa-session');
const passport = require('koa-passport');
const helmet = require('koa-helmet');
const koaEjs = require('koa-ejs');
const path = require('path');
const { cookieSecret, port } = require('./config');
const router = require('./router');
const {
    configurePassport,
    checkAuthenticatedMiddleware,
} = require('./passport');
const { proxyMiddleware, proxyWebSocket } = require('./proxy');
const {
    refreshEksTokenMiddleware,
    checkAwsCredentialsMiddleware,
} = require('./aws');
const log = require('./logger');

const startServer = async () => {
    await configurePassport();

    const app = new Koa();

    // Some prerequisites and securtity features
    app.keys = [cookieSecret];
    app.proxy = true; // Trust down stream proxy header fields

    // NOTE: Do not parse the body of the incoming request (using body parser or the like)
    // or the proxy will not be able to forward it on.
    app.use(session({}, app));
    app.use(helmet());

    // Set up EJS for rendering HTML
    koaEjs(app, {
        root: path.join(__dirname, '../templates'),
        viewExt: 'ejs',
        layout: false,
    });

    // Set up passport for authentication
    app.use(passport.initialize());
    app.use(passport.session());

    // Redirect users to the login page if they are not authenticated
    app.use(checkAuthenticatedMiddleware);

    // Redirect users to the login page if their AWS creds have expired
    app.use(checkAwsCredentialsMiddleware);

    // Refresh the EKS auth token if it has expired
    app.use(refreshEksTokenMiddleware);

    // Handle routes (e.g. for login)
    app.use(router.routes());
    app.use(router.allowedMethods());

    // Proxy all requests on any path not defined in the router to proxyHost
    app.use(proxyMiddleware);

    const server = app.listen(port);
    server.on('upgrade', proxyWebSocket);
    server.on('error', log.error.bind(log));

    log.info(`Proxy server running on port ${port}`);
};

startServer();
