const ObjectId = require('bson').ObjectId;
const Record = require('immutable').Record;

const SoundCloudUser = new Record({
    _id: null,
    sc_id: null,
    sc_auth: null,
    sc_profile: null,
    wallet_id: null,
    crawlers: null,
    config: null
}, 'SoundCloudUser');

SoundCloudUser.prototype.toClient = function() {
    let user = this.toJS();
    return user.sc_profile;
};

module.exports = SoundCloudUser;