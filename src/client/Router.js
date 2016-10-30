import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Router, Route, IndexRoute, browserHistory, Link } from 'react-router';

import RefreshIndicator from 'material-ui/RefreshIndicator';

import LoginPage from './containers/LoginPage';

import History from './containers/HistoryPage';
import Transactions from './containers/TransactionsPage';
import AppPage from './components/AppPage';
import Profile from './containers/Profile';

import { checkAuthentication }  from './actions/auth';

const NoMatch = () => (
    <div>
        <span>The resource you requested desn't exists</span>
        <Link to="/">Go home</Link>
    </div>
);

const LoggedApp = () => (
    <Router history={browserHistory}>
        <Route path="/" component={AppPage}>
            <IndexRoute component={History} />
            <Route path="/history" component={History} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/profile" component={Profile} />
            <Route path="/*" component={NoMatch} />
        </Route>
    </Router>
);

const Loader = () => (
    <div>
        <RefreshIndicator
            size={100}
            left={100}
            top={100}
            status={"loading"}
        />
    </div>);

class AppRouter extends Component {

    static propTypes = {
        auth: PropTypes.object.isRequired,
        checkAuthentication: PropTypes.func.isRequired
    };

    componentWillMount() {
        this.props.checkAuthentication();
    }

    render() {
        if(this.props.auth.isFetching) {
            return <Loader />;
        } else {
            if(this.props.auth.isAuthenticated) {
                return <LoggedApp />;
            } else {
                return <LoginPage />;
            }
        }
    }
}

const mapStateToProps = (state) => {
    const { auth } = state;

    return {
        auth
    };
};
const mapDispatchToProps = {
    checkAuthentication
};

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
