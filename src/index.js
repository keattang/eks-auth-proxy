require('dotenv').config();

const Koa = require('koa');
const session = require('koa-session');
const passport = require('koa-passport');
const bodyParser = require('koa-bodyparser');
const helmet = require('koa-helmet');
const { cookieSecret, port } = require('./config');
const router = require('./router');
const {
    configurePassport,
    unAuthenticatedRedirectMiddleware,
} = require('./passport');
const proxy = require('./proxy');
const {
    refreshEksTokenMiddleware,
    checkAwsCredentialsMiddleware,
} = require('./aws');

const startServer = async () => {
    await configurePassport();

    const app = new Koa();

    // Some prerequisites and securtity features
    app.keys = [cookieSecret];
    app.proxy = true; // Trust down stream proxy header fields
    app.use(bodyParser());
    app.use(session({}, app));
    app.use(helmet());

    // Set up passport for authentication
    app.use(passport.initialize());
    app.use(passport.session());

    // Redirect users to the login page if they are not authenticated
    app.use(unAuthenticatedRedirectMiddleware);

    // Redirect users to the login page if their AWS creds have expired
    app.use(checkAwsCredentialsMiddleware);

    // Refresh the EKS auth token if it has expired
    app.use(refreshEksTokenMiddleware);

    // Proxy all requests on any path not defined in the router to proxyHost
    app.use(proxy);

    // Handle routes (e.g. for login)
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(port);
    console.log('Proxy server running on port', port);
};

startServer();
