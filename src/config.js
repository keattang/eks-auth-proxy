const yargs = require('yargs');

const parser = yargs
    .env('EKS_AUTH')
    .help()
    .usage('$0 [options]', 'Start the proxy server', () => {
        yargs.options({
            port: {
                alias: 'p',
                describe: 'The port that the proxy server should listen on.',
                type: 'string',
                default: 3001,
                requiresArg: true,
                group: 'Server options',
            },
            'cookie-secret': {
                describe:
                    'The secret used to sign cookies. This should be a random string that you generate this yourself using a secure algorithm.',
                type: 'string',
                requiresArg: true,
                group: 'Server options',
                demandOption: true,
            },
            'max-sessions': {
                describe:
                    'The maximum number of sessions to store in memory. This is useful to keep memory usage low if you expect high levels of use.',
                type: 'number',
                requiresArg: true,
                group: 'Server options',
                default: 999999,
            },
            'login-url': {
                describe:
                    'The path to the login page. Unauthenticated requests are redirect to this page.',
                type: 'string',
                default: '/login',
                group: 'Server options',
            },
            debug: {
                describe: 'Whether or not to enable DEBUG level logging',
                type: 'boolean',
                default: false,
                group: 'Server options',
            },
            'cluster-name': {
                describe:
                    'The name of the EKS cluster. This will be used to generate the EKS auth token.',
                type: 'string',
                requiresArg: true,
                group: 'AWS options',
                demandOption: true,
            },
            'iam-role': {
                alias: 'iam-roles',
                describe:
                    'The IAM role ARN to assume when logging in. The temporary credentials from this role will be used to generate the EKS auth token. You can use this flag multiple times to allow users to select a role.',
                type: 'string',
                requiresArg: true,
                group: 'AWS options',
                demandOption: true,
                array: true,
            },
            'iam-session-duration': {
                describe:
                    'The number of seconds that the temporary IAM credentials should be valid for when assuming the iam-role. This will equate to the maximum amount of time that the user will remain logged in for. This must not exceed the allowed maximum session time of the role.',
                type: 'number',
                requiresArg: true,
                group: 'AWS options',
            },
            'client-id': {
                describe: 'The OIDC client ID from your OIDC provider.',
                type: 'string',
                requiresArg: true,
                group: 'OIDC options',
                demandOption: true,
            },
            'client-secret': {
                describe: 'The OIDC client secret from your OIDC provider.',
                type: 'string',
                requiresArg: true,
                group: 'OIDC options',
                demandOption: true,
            },
            'oidc-issuer': {
                describe:
                    'The URL for the OIDC issuer. E.g. https://accounts.google.com',
                type: 'string',
                requiresArg: true,
                group: 'OIDC options',
                demandOption: true,
            },
            'email-domain': {
                alias: 'email-domains',
                describe:
                    'Specify this option to restrict access to users with a certain email address domain. You can specify this option multiple times to restrict to multiple domains.',
                type: 'string',
                requiresArg: true,
                group: 'OIDC options',
                demandOption: false,
                array: true,
            },
            'ignore-email-verification': {
                describe:
                    'Whether or not to allow users where their email_verfied claim is false.',
                type: 'boolean',
                group: 'OIDC options',
                default: false,
            },
            'proxy-host': {
                describe: 'The host name of the upstream server.',
                type: 'string',
                requiresArg: true,
                group: 'Proxy options',
                demandOption: true,
            },
            'proxy-use-https': {
                describe:
                    'Whether or not to use HTTPS when contacting the upstream server.',
                type: 'boolean',
                default: false,
                group: 'Proxy options',
            },
            'proxy-preserve-host': {
                describe:
                    'Whether or not to pass on the host header to the upstream server.',
                type: 'boolean',
                default: false,
                group: 'Proxy options',
            },
            'proxy-disable-csp-header': {
                describe:
                    'Whether or not to disable Content Security Policy (CSP) header (not recommendable).',
                type: 'boolean',
                default: false,
                group: 'Proxy options',
            },
        });
    });

module.exports = parser.argv;
