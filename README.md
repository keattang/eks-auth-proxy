# eks-auth-proxy

This proxy server is designed to sit in front of applications that run in EKS clusters and access the Kubernetes API. It prevents access until the user has logged in using a third party provider (e.g. Google, Github, etc.) that can be federated with an AWS IAM role. It then creates an EKS authorization token based on the temporary credentials it receives from assuming the role. This is passed on as `Bearer` token via the `Authorization` header to the upstream server. This is particularly useful for exposing and protecting the Kubernetes dashboard.

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
  --client-id      The OIDC client ID from your OIDC provider.
                                                             [string] [required]
  --client-secret  The OIDC client secret from your OIDC provider.
                                                             [string] [required]
  --oidc-issuer    The URL for the OIDC issuer. E.g. https://accounts.google.com
                                                             [string] [required]
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
