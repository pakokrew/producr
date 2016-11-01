const Record = require('immutable').Record;

// TODO nest from et to
const Transaction = new Record({
    _id: null,
    fromUserScId: null,
    toUserScId: null,
    fromUserName: null,
    toUserScName: null,
    amount: 0,
    date: Date.now(),
    trackId: null,
    trackTitle: null,
    playId: null,
}, 'Transaction');


module.exports = Transaction;