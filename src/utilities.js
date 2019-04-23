const expired = (expiry, bufferMs = 0) => {
    const expiryDate = new Date(expiry);
    const bufferedExpiry = new Date(expiryDate.getTime() - bufferMs);
    const now = new Date();
    return bufferedExpiry <= now;
};

const getRoleLinkObjects = (roleArns, basePath) =>
    roleArns.map((arn, idx) => {
        const name = arn.split('/')[1];
        return { arn, name, link: `${basePath}?iam_role=${idx}` };
    });

const getProxyReqHeaders = proxyReq => {
    const symbols = Object.getOwnPropertySymbols(proxyReq);
    const headerKey = symbols.find(
        s => s.toString() === 'Symbol(outHeadersKey)'
    );
    return proxyReq[headerKey];
};

module.exports = {
    expired,
    getRoleLinkObjects,
    getProxyReqHeaders,
};
