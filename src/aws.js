const AWS = require('aws-sdk');
const shell = require('shelljs');
const {
    clusterName,
    loginUrl,
    iamRoles,
    iamSessionDuration,
} = require('./config');
const { expired } = require('./utilities');
const { sessionStore } = require('./sessionStore');
const log = require('./logger');

const sts = new AWS.STS();
const EXPIRATION_BUFFER_MS = 1 * 60 * 1000; // 1 minute

const callAuthenticator = (credentials) => {
    const { AccessKeyId, SecretAccessKey, SessionToken } =
        credentials.Credentials;

    shell.env.AWS_ACCESS_KEY_ID = AccessKeyId;
    shell.env.AWS_SECRET_ACCESS_KEY = SecretAccessKey;
    shell.env.AWS_SESSION_TOKEN = SessionToken;

    log.debug(
        `Calling aws-iam-authenticator with
        clusterName=${clusterName}
        AWS_ACCESS_KEY_ID=${AccessKeyId}
        AWS_SECRET_ACCESS_KEY=${SecretAccessKey}
        AWS_SESSION_TOKEN=${SessionToken}`
    );

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

const getTemporaryAwsCredentials = (email, idToken, role = iamRoles[0]) => {
    log.debug(
        `Assuming role ${role} with sessionName ${email} and token ${idToken}`
    );
    return sts
        .assumeRoleWithWebIdentity({
            RoleArn: role,
            RoleSessionName: email,
            WebIdentityToken: idToken,
            DurationSeconds: iamSessionDuration,
        })
        .promise();
};

const getEksAuthToken = (credentials) => {
    const eksToken = callAuthenticator(credentials);
    return eksToken.status;
};

const checkAwsCredentialsMiddleware = async (ctx, next) => {
    ctx.state.awsCredentialsValid = false;

    if (!ctx.state.user || ctx.path.startsWith(loginUrl)) {
        await next();
        return;
    }

    const { awsCredentials, sessionKey } = ctx.state.user;

    if (expired(awsCredentials.Credentials.Expiration, EXPIRATION_BUFFER_MS)) {
        sessionStore.deleteSession(sessionKey);
        ctx.logout();
        ctx.redirect(loginUrl);
        return;
    }

    ctx.state.awsCredentialsValid = true;

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
