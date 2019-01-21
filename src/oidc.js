const { Issuer } = require('openid-client');
const { Strategy } = require('openid-client');
const { getEksAuthToken, getTemporaryAwsCredentials } = require('./aws');
const {
    clientSecret,
    clientId,
    oidcIssuer,
    loginUrl,
    iamRoles,
    emailDomains,
    ignoreEmailVerification,
} = require('./config');

let passportStrategy;

const getBasePath = () => `${loginUrl}/oauth`;
const getCallbackPath = () => `${getBasePath()}/callback`;
const getRedirectUrl = ctx =>
    `${ctx.protocol}://${ctx.host}${getCallbackPath()}`;

const getClient = async () => {
    Issuer.defaultHttpOptions = { timeout: 5000 };
    const issuer = await Issuer.discover(oidcIssuer);

    return new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
    });
};

const getAssumeRoleErrorMessage = (error, roleArn) => {
    if (error.code === 'AccessDenied') {
        return `You do not have permission to assume the role ${roleArn}`;
    }
    return `Unable to assume role ${roleArn}. Check that it is correctly configured.`;
};

const validateEmail = userinfo => {
    // Check that the email address domain is valid if --email-domain(s) is specified
    if (emailDomains !== undefined) {
        const validDomain = emailDomains.some(domain =>
            userinfo.email.endsWith(`@${domain}`)
        );
        if (!validDomain) {
            return {
                emailValid: false,
                emailError: 'Your email address domain is not allowed.',
            };
        }
    }

    // Make sure the email address has been verified by the IDP
    if (!userinfo.email_verified && !ignoreEmailVerification) {
        return {
            emailValid: false,
            emailError:
                'Your email address must be verified with your identity provider before you can log in.',
        };
    }

    return { emailValid: true };
};

// Take the info returned from the OIDC provider and return a user object
// This cannot be an arrow function as we rely on `this` to be the strategy that
// calls this function
async function handleAuthenticationSuccess(tokenset, userinfo, done) {
    let awsCredentials;

    // Check the email address
    const { emailValid, emailError } = validateEmail(userinfo);
    if (!emailValid) {
        return done(null, false, { message: emailError });
    }

    // Assume the IAM role
    try {
        awsCredentials = await getTemporaryAwsCredentials(
            userinfo.email,
            tokenset.id_token,
            this.iamRole
        );
    } catch (e) {
        return done(null, false, {
            error: e,
            message: getAssumeRoleErrorMessage(e, this.iamRole || iamRoles[0]),
        });
    }

    // Get and set the cluster auth details
    const eksToken = getEksAuthToken(awsCredentials);
    const user = { id: userinfo.sub, ...userinfo, eksToken, awsCredentials };

    return done(null, user);
}

const getPassportStrategy = async () => {
    if (passportStrategy !== undefined) {
        return Promise.resolve(passportStrategy);
    }

    const client = await getClient();

    const params = { scope: 'openid email' };
    const usePKCE = true; // optional, defaults to false, when true the code_challenge_method will be
    // resolved from the issuer configuration, instead of true you may provide
    // any of the supported values directly, i.e. "S256" (recommended) or "plain"

    passportStrategy = new Strategy(
        { client, params, usePKCE },
        handleAuthenticationSuccess
    );

    return passportStrategy;
};

// Sets the redirect_uri dynamically based on the host and uses the `iam_role` query parameter
// to dynamically set the role to be assumed
const dynamicStrategyMiddleware = async (ctx, next) => {
    const strategy = await getPassportStrategy();
    strategy._params.redirect_uri = getRedirectUrl(ctx);

    const roleIndex = parseInt(ctx.query.iam_role, 10);
    if (!Number.isNaN(roleIndex)) {
        strategy.iamRole = iamRoles[roleIndex];
    }

    await next();
};

module.exports = {
    getClient,
    getPassportStrategy,
    getBasePath,
    getCallbackPath,
    dynamicStrategyMiddleware,
};
