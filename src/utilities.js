const expired = (expiry, bufferMs = 0) => {
    const expiryDate = new Date(expiry);
    const bufferedExpiry = new Date(expiryDate.getTime() - bufferMs);
    const now = new Date();
    return bufferedExpiry <= now;
};

module.exports = {
    expired,
};
