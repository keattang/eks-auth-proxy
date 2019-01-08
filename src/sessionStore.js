const crypto = require('crypto');

const getNewSessionKey = () => crypto.randomBytes(32).toString('hex');

class InMemorySessionStore {
    constructor() {
        this.store = {};
    }

    getSession(key) {
        return this.store[key];
    }

    setSession(key, data) {
        this.store[key] = data;
    }

    newSession(data) {
        const sessionKey = getNewSessionKey();
        this.setSession(sessionKey, { ...data, sessionKey });
        return sessionKey;
    }

    deleteSession(key) {
        delete this.store[key];
    }
}

module.exports = {
    getNewSessionKey,
    sessionStore: new InMemorySessionStore(),
};
