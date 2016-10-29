import { combineReducers } from 'redux';

import * as Actions from '../actions';

const fetchDefaultState = {
    isFetching: true
};
const authDefaultState = {
    isFetching: true,
    isAuthenticated: false
};

function auth(state = authDefaultState, action) {
    switch (action.type) {
        case Actions.AUTH_REQUEST:
            return Object.assign({}, {
                isFetching: true,
                isAuthenticated: false
            });
        case Actions.AUTH_NULL:
            return Object.assign({}, {
                isFetching: false,
                isAuthenticated: false
            });
        case Actions.AUTH_SUCCESS:
            return Object.assign({}, {
                isFetching: false,
                isAuthenticated: true,
                jwt: action.jwt,
                profile: action.profile
            });
        case Actions.AUTH_ERROR:

            return Object.assign({}, {
                isFetching: false,
                isAuthenticated: false,
                error: action.error,
            });
        default:
            return state;
    }
}

function userHistory(state = fetchDefaultState, action) {
    switch (action.type) {
        case Actions.REQUEST_HISTORY:
            return Object.assign({}, state, {
                isFetching: true,
            });
        case Actions.RECEIVE_HISTORY:
            return Object.assign({}, state, {
                isFetching: false,
                ...action.history
            });
        default:
            return state;
    }
}
function wallet(state = fetchDefaultState, action) {
    switch (action.type) {
        case Actions.REQUEST_WALLET:
            return Object.assign({}, state, {
                isFetching: true,
            });
        case Actions.RECEIVE_WALLET:
            return Object.assign({}, state, {
                isFetching: false,
                ...action.wallet
            });
        default:
            return state;
    }
}

const rootReducer = combineReducers({
    auth,
    userHistory,
    wallet
});

export default rootReducer;