const passport = require('koa-passport');
const Router = require('koa-router');
const { loginUrl, iamRoles } = require('./config');
const oidc = require('./oidc');
const { getRoleLinkObjects } = require('./utilities');
const log = require('./logger');

const router = new Router();

// If there is only one role redirect straight to the appropriate login handler
// Otherwise show a list of buttons allowing the user to select the role to login with
router.get(loginUrl, async (ctx) => {
    if (iamRoles.length === 1) {
        ctx.redirect(oidc.getBasePath());
    } else {
        await ctx.render('login', {
            roles: getRoleLinkObjects(iamRoles, oidc.getBasePath()),
        });
    }
});

// Return 200 if the user is logged in, otherwise return 401
router.get(`${loginUrl}/check`, async (ctx) => {
    if (ctx.isAuthenticated() && !ctx.state.awsCredentialsValid) {
        ctx.body = 'OK';
        return;
    }
    ctx.throw(401);
});

// Start OIDC authentication request
router.get(
    oidc.getBasePath(),
    oidc.dynamicStrategyMiddleware,
    passport.authenticate('oidc')
);

// OIDC authentication callback
router.get(oidc.getCallbackPath(), (ctx) =>
    passport.authenticate('oidc', async (error, user, info) => {
        // If authentication failed, render an error message
        if (error || user === false) {
            const renderContext = {
                error,
                ...info,
                loginUrl,
            };

            renderContext.message =
                renderContext.message ||
                'An unexpected error occured while trying to log you in.';

            if (renderContext.error) {
                log.error(renderContext.error);
            }

            await ctx.render('error', renderContext);
            return;
        }

        // Otherwise log the user in and redirect to the root URL
        await ctx.login(user);
        ctx.redirect('/');
    })(ctx)
);

module.exports = router;
