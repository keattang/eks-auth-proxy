const passport = require('koa-passport');
const { sessionStore } = require('./sessionStore');
const oidc = require('./oidc');
const { loginUrl } = require('./config');

// Take a user object and serialize it into the data that will be stored in the session cookie
const handleSerializeUser = (user, done) => {
    const sessionKey = sessionStore.newSession(user);
    done(null, sessionKey);
};

// Take the data that was found in the session cookie (created by serializeUser) and turn it
// into a user object. Return false if unable to get the user.
const handleDeserializeUser = (sessionKey, done) => {
    const user = sessionStore.getSession(sessionKey) || false;
    done(null, user);
};

// Set up the auth strategies and session (de)serializers
const configurePassport = async () => {
    passport.use('oidc', await oidc.getPassportStrategy());
    passport.serializeUser(handleSerializeUser);
    passport.deserializeUser(handleDeserializeUser);
};

// Redirect users to the login page if they are not authenticated
const unAuthenticatedRedirectMiddleware = async (ctx, next) => {
    if (!ctx.isAuthenticated() && !ctx.path.startsWith(loginUrl)) {
        ctx.redirect(loginUrl);
        return;
    }
    await next();
};

module.exports = { configurePassport, unAuthenticatedRedirectMiddleware };
