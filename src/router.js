const passport = require('koa-passport');
const Router = require('koa-router');
const { loginUrl, iamRoles } = require('./config');
const oidc = require('./oidc');
const { getRoleLinkObjects } = require('./utilities');

const router = new Router();

// If there is only one role redirect straight to the appropriate login handler
// Otherwise show a list of buttons allowing the user to select the role to login with
router.get(loginUrl, async (ctx, next) => {
    if (iamRoles.length === 1) {
        ctx.redirect(oidc.getBasePath());
        await next();
    } else {
        await ctx.render('login', {
            roles: getRoleLinkObjects(iamRoles, oidc.getBasePath()),
        });
    }
});

// Start OIDC authentication request
router.get(
    oidc.getBasePath(),
    oidc.dynamicStrategyMiddleware,
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
