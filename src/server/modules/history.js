const _ = require('lodash');
const Immutable = require('immutable');
const moment = require('moment');
const async = require('async');

const ResourceObject = require('../connectors/soundcloudResource');
const SoundCloud = require('../connectors/soundcloud');
const DBWrapper = require('./wrappers').DB;

const ListenedStates = {
    LISTENING: 'LISTENING',
    LISTENED: 'LISTENED',
    SKIPPED: 'SKIPPED'
};
const ListenedTimes = {
    SKIP: 10
};

// TODO :
// - get song duration and compare with play duration to better validate
// - last listened, compare with now and duration

const History = {

    computeDiff: (history) => {
        const imHistory = Immutable.fromJS(history);
        return imHistory.map((play, index) => {
            let diff = null;
            if(index !== 0) {
                let lastPlayed = imHistory.get(index-1).get('played_at');
                diff = lastPlayed - play.get('played_at');
                diff = Math.floor(diff/1000);
            }
            return play.set('played_duration', diff);
        }).toJS();
    },
    getListenedState: (diff) => {
        if(_.isNil(diff)) {
            return ListenedStates.LISTENING;
        } else if(diff < ListenedTimes.SKIP) {
            return ListenedStates.SKIPPED;
        } else {
            return ListenedStates.LISTENED;
        }
    },
    setListenedState: (history) => {
        return Immutable.fromJS(history)
            .map(play =>
                play.set('listenedState',
                    History.getListenedState(play.get('played_duration'))))
            .toJS();
    },

    updateUserHistory: (user) => {
        let updateData = {
            fetchTime: Date.now()
        };

        var resourceObject = new ResourceObject(user.token);
        resourceObject.recentlyPlayed();
        resourceObject.tracks();
        resourceObject.get();


        return SoundCloud.askResource(resourceObject)
            .then(resource => { updateData.newHistory = resource.collection; })
            .then(() => DBWrapper.collections.UserHistory
                .find({userId: user.id}, {lastFetched: 1, history : { $slice : [0 , 1] } })
                .next()
            )
            .then(userHistory => {
                updateData.userHistory = userHistory;
                //if(userHistory)
                const lastFetched = userHistory && userHistory.lastFetched || 0;

                updateData.newHistory = History.computeDiff(updateData.newHistory);
                updateData.newHistory = History.setListenedState(updateData.newHistory);
                updateData.newHistory = updateData.newHistory.filter(play => play.played_at > lastFetched);

                return updateData;
            })
            .then(updateData => DBWrapper.collections.UserHistory
                .updateOne({userId: user.id}, {
                    '$set': {
                        lastFetched: updateData.fetchTime,
                    },
                    '$push': {
                        'history': {
                            '$each': updateData.newHistory,
                            '$position': 0,
                        }
                    }
                }, { upsert: true })
            );

    },

    hydrateHistory: (userHistory) => {
        const hydratedUserHistory = {
            userId: userHistory.userId,
            lastFetched: moment(new Date(userHistory.lastFetched)).format("DD-MM-YYYY HH:mm:ss"),
        };

        return new Promise((resolve, reject) => {
            async.map(userHistory.history, (play, cb) => {
                play.date = moment(new Date(play.played_at)).format("DD-MM-YYYY HH:mm:ss");
                var trackResource = ResourceObject.fromUrn(play.urn);
                SoundCloud.cachedResource(trackResource)
                    .then(track => {
                        play.title = track.title;
                        play.username = track.user.username;
                        cb(null, play);
                    })
                    .catch(() => {
                        play.deleted = true;
                        cb(null, play);
                    });
            }, (err, results) => {
                if(err) {
                    reject(err);
                } else {
                    hydratedUserHistory.history = results;
                    resolve(hydratedUserHistory);
                }
            });
        });
    },

    getUserHistory: (user, hydrate) => {
        return DBWrapper.collections.UserHistory
            .find({userId: user.id})
            .next()
            .then(userHistory => hydrate ? History.hydrateHistory(userHistory) : userHistory);
    }

};

History.ListenedStates = ListenedStates;
History.ListenedTimes = ListenedTimes;

module.exports = History;