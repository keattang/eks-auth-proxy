const crypto = require('crypto');
const LRU = require('lru-cache');
const { maxSessions } = require('./config');

const getNewSessionKey = () => crypto.randomBytes(32).toString('hex');

class InMemorySessionStore {
    constructor() {
        this.store = new LRU(maxSessions);
    }

    getSession(key) {
        return this.store.get(key);
    }

    setSession(key, data) {
        this.store.set(key, data);
    }

    newSession(data) {
        const sessionKey = getNewSessionKey();
        this.setSession(sessionKey, { ...data, sessionKey });
        return sessionKey;
    }

    deleteSession(key) {
        this.store.del(key);
    }
}

module.exports = {
    getNewSessionKey,
    sessionStore: new InMemorySessionStore(),
};
