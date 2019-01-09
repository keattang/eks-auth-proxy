const AWS = require('aws-sdk');
const shell = require('shelljs');
const {
    clusterName,
    loginUrl,
    iamRole,
    iamSessionDuration,
} = require('./config');
const { expired } = require('./utilities');
const { sessionStore } = require('./sessionStore');

const sts = new AWS.STS();
const EXPIRATION_BUFFER_MS = 1 * 60 * 1000; // 1 minute

const callAuthenticator = credentials => {
    shell.env.AWS_ACCESS_KEY_ID = credentials.AccessKeyId;
    shell.env.AWS_SECRET_ACCESS_KEY = credentials.SecretAccessKey;
    shell.env.AWS_SESSION_TOKEN = credentials.SessionToken;

    const result = shell.exec(
        `./binaries/aws-iam-authenticator token -i ${clusterName}`,
        { silent: true }
    );

    shell.env.AWS_ACCESS_KEY_ID = undefined;
    shell.env.AWS_SECRET_ACCESS_KEY = undefined;
    shell.env.AWS_SESSION_TOKEN = undefined;

    if (result.code !== 0) {
        throw Error(result.stderr);
    }

    return JSON.parse(result.stdout);
};

const getTemporaryAwsCredentials = (email, idToken) =>
    sts
        .assumeRoleWithWebIdentity({
            RoleArn: iamRole,
            RoleSessionName: email,
            WebIdentityToken: idToken,
            DurationSeconds: iamSessionDuration,
        })
        .promise();

const getEksAuthToken = credentials => {
    const eksToken = callAuthenticator(credentials);
    return eksToken.status;
};

const checkAwsCredentialsMiddleware = async (ctx, next) => {
    if (!ctx.state.user || ctx.path.startsWith(loginUrl)) {
        await next();
        return;
    }

    const { awsCredentials, sessionKey } = ctx.state.user;

    if (expired(awsCredentials.Credentials.Expiration, EXPIRATION_BUFFER_MS)) {
        sessionStore.deleteSession(sessionKey);
        ctx.redirect(loginUrl);
        return;
    }

    await next();
};

const refreshEksTokenMiddleware = async (ctx, next) => {
    if (!ctx.state.user) {
        await next();
        return;
    }

    const { eksToken, sessionKey, awsCredentials } = ctx.state.user;

    if (expired(eksToken.expirationTimestamp, EXPIRATION_BUFFER_MS)) {
        ctx.state.user.eksToken = getEksAuthToken(awsCredentials);
        sessionStore.setSession(sessionKey, ctx.state.user);
    }

    await next();
};

module.exports = {
    getEksAuthToken,
    getTemporaryAwsCredentials,
    refreshEksTokenMiddleware,
    checkAwsCredentialsMiddleware,
};
