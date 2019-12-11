# eks-auth-proxy

This proxy server is designed to sit in front of applications that run in EKS clusters and access the Kubernetes API. It prevents access until the user has logged in using a third party provider (e.g. Google, Github, etc.) that can be federated with one or more AWS IAM roles. It then creates an EKS authorization token based on the temporary credentials it receives from assuming one of the roles. This is passed on as `Bearer` token via the `Authorization` header to the upstream server. This is particularly useful for exposing and protecting the Kubernetes dashboard.

The server is designed to sit behind a trusted reverse proxy (e.g. nginx, ELB, ALB) that handles SSL/TLS termination. DO NOT expose this directly to the internet.

Currently, only OIDC identity providers are supported but this could be extended to also support SAML providers. (Pull requests welcome) For more information on setting up an OIDC identity provider in AWS see [this article](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)

![alt text](./images/architecture.png 'Architecture Diagram')

## Prerequisites

Before running this server you will need to do the following:

-   Setup an OIDC identity provider (e.g. [Google](https://developers.google.com/identity/protocols/OpenIDConnect))
-   Use the details from the previous step to create an OIDC identity provider and associated role in AWS https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html
-   Add a role mapping in the `aws-auth` configmap in your EKS cluster https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html

## Running the server

```
docker run keattang/eks-auth-proxy ./start \
    --cookie-secret random-string \
    --cluster-name my-cluster \
    --iam-role arn:aws:iam::xxxxxxxxxxxx:role/my-role \
    --client-id my-client-id \
    --client-secret my-client-secret \
    --oidc-issuer http://my-issuer.com \
    --proxy-host upstream-server.com
```

## Configuration

The server is configured by passing the flags below. All flags can also be provided as environment
variables by converting the flag to upper-snake case and prefixing with `EKS_AUTH` e.g. `--cookie-secret` -> `EKS_AUTH_COOKIE_SECRET`.

```
Server options
  --port, -p       The port that the proxy server should listen on.
                                                        [string] [default: 3001]
  --cookie-secret  The secret used to sign cookies. This should be a random
                   string that you generate this yourself using a secure
                   algorithm.                                [string] [required]
  --max-sessions   The maximum number of sessions to store in memory. This is
                   useful to keep memory usage low if you expect high levels of
                   use.                             [number] [default: Infinity]
  --login-url      The path to the login page. Unauthenticated requests are
                   redirect to this page.           [string] [default: "/login"]
  --debug          Whether or not to enable DEBUG level logging
                                                      [boolean] [default: false]
AWS options
  --cluster-name           The name of the EKS cluster. This will be used to
                           generate the EKS auth token.      [string] [required]
  --iam-role, --iam-roles  The IAM role ARN to assume when logging in. The
                           temporary credentials from this role will be used to
                           generate the EKS auth token. You can use this flag
                           multiple times to allow users to select a role.
                                                              [array] [required]
  --iam-session-duration   The number of seconds that the temporary IAM
                           credentials should be valid for when assuming the
                           iam-role. This will equate to the maximum amount of
                           time that the user will remain logged in for. This
                           must not exceed the allowed maximum session time of
                           the role.                                    [number]
OIDC options
  --client-id                      The OIDC client ID from your OIDC provider.
                                                             [string] [required]
  --client-secret                  The OIDC client secret from your OIDC
                                   provider.                 [string] [required]
  --oidc-issuer                    The URL for the OIDC issuer. E.g.
                                   https://accounts.google.com
                                                             [string] [required]
  --email-domain, --email-domains  Specify this option to restrict access to
                                   users with a certain email address domain.
                                   You can specify this option multiple times to
                                   restrict to multiple domains.         [array]
  --ignore-email-verification      Whether or not to allow users where their
                                   email_verfied claim is false.
                                                      [boolean] [default: false]
Proxy options
  --proxy-host           The host name of the upstream server.
                                                             [string] [required]
  --proxy-use-https      Whether or not to use HTTPS when contacting the
                         upstream server.             [boolean] [default: false]
  --proxy-preserve-host  Whether or not to pass on the host header to the
                         upstream server.             [boolean] [default: false]
Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## Routes

The auth proxy namespaces all its routes under the given `--login-url` which defaults to `/login`. The proxy routes are:

-   `/login`: This is the login page. It will display a list of roles to assume or will automatically redirect to your auth provider if you only have one role configured. If you are not authenticated and you navigate to a route that does not begin with `/login` you will be redirected to `/login`

-   `/login/check`: This route returns a 200 if you are authenticated and a 401 if not. This is useful for integrating with Nginx.

## Development

To run and test the eks-auth-proxy locally, create a `.env` file in the project root with at least the following values:

```
EKS_AUTH_CLUSTER_NAME=
EKS_AUTH_IAM_ROLE=
EKS_AUTH_CLIENT_ID=
EKS_AUTH_CLIENT_SECRET=
EKS_AUTH_OIDC_ISSUER=
EKS_AUTH_COOKIE_SECRET=
EKS_AUTH_DEBUG=true
```

Then run `docker-compose up`. This will spin up the eks-auth-proxy at `http://localhost:3001` in front of a mock upstream server. You can edit the upstream server in the file `test/upstreamServer.js`.

### Docker hub deployment

In order to publish a new version to Docker hub, push your code changes to up to GitHub and tag a release with the format `vx.x.x`. Docker hub will automatically pick up this release and publish it.
