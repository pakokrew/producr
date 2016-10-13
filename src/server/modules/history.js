const _ = require('lodash');
const Immutable = require('immutable');
const moment = require('moment');
const async = require('async');

const SoundcloudResource = require('../connectors/soundcloudResource');
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

    updateUserHistory: (user, reset) => {
        let updateData = {
            fetchTime: Date.now()
        };

        var resourceObject = new SoundcloudResource(user.token);
        resourceObject.recentlyPlayed();
        resourceObject.tracks();
        resourceObject.get();

        return SoundCloud.askResource(resourceObject)
            .then(resource => { updateData.newHistory = resource.collection; })
            .then(() => DBWrapper.collections.UserHistory
                .find({userId: user.id})
                .next()
            )
            .then(userHistory => {
                const lastFetched = userHistory && userHistory.lastFetched || 0;

                updateData.newHistory = History.computeDiff(updateData.newHistory);
                updateData.newHistory = History.setListenedState(updateData.newHistory);

                if(reset) {
                    return updateData;
                }

                updateData.oldLastTrackFetched = updateData.newHistory.find(play => play.played_at <= lastFetched);

                updateData.newHistory = updateData.newHistory.filter(play => play.played_at > lastFetched);

                if(updateData.oldLastTrackFetched) {
                    updateData.newHistory = updateData.newHistory.concat(updateData.oldLastTrackFetched);
                }

                return updateData;
            })
            .then((updateData) => reset ?
                DBWrapper.collections.UserHistory.updateOne({userId: user.id},
                    {
                        '$set': {
                            lastFetched: updateData.fetchTime,
                            history : updateData.newHistory
                        },
                    },
                    { upsert: true }
                )
                :
                DBWrapper.collections.UserHistory.updateOne(
                    {userId: user.id},
                    {
                        '$set': { lastFetched: updateData.fetchTime },
                    },
                    { upsert: true })
                    .then(() => {
                        if(updateData.newHistory.length > 0 && updateData.oldLastTrackFetched) {
                            return DBWrapper.collections.UserHistory.updateOne({userId: user.id},
                                {
                                    '$pop': {
                                        'history': -1
                                    }
                                }
                            );
                        }

                    })
                    .then(() => {
                        if(updateData.newHistory.length > 0) {
                            return DBWrapper.collections.UserHistory.updateOne({userId: user.id},
                                {
                                    '$push': {
                                        'history': {
                                            '$each': updateData.newHistory,
                                            '$position': 0
                                        }
                                    }
                                }
                            )
                        }
                    })
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
                var trackResource = SoundcloudResource.fromUrn(play.urn);
                SoundCloud.cachedResource(trackResource)
                    .then(track => {
                        play.title = track.title;
                        play.artist = track.user.username;
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