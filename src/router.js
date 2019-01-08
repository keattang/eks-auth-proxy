const passport = require('koa-passport');
const Router = require('koa-router');
const { loginUrl } = require('./config');
const oidc = require('./oidc');

const router = new Router();

// Redirect to the appropriate login handler
router.get(loginUrl, async (ctx, next) => {
    ctx.redirect(oidc.getBasePath());
    await next();
});

// Start OIDC authentication request
router.get(
    oidc.getBasePath(),
    oidc.dynamicRedirectUrlMiddleware,
    passport.authenticate('oidc')
);

// OIDC authentication callback
router.get(
    oidc.getCallbackPath(),
    passport.authenticate('oidc', {
        successRedirect: '/',
        failureRedirect: loginUrl,
    })
);

module.exports = router;
