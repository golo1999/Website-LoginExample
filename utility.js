import mongo from 'mongodb';
import assert from 'assert';
import bcrypt from 'bcrypt';

const mongoClient = mongo.MongoClient;

const saltRounds = 10;

const databaseURL = 'mongodb://localhost:127.0.0.1:27017/users';
const usersCollectionName = 'users';

const homeRoute = '/home';
const incorrectCredentialsRoute = '/incorrect-credentials';
const loginRoute = '/login';
const logoutRoute = '/logout';
const passwordsNotMatchingRoute = '/passwords-dont-match';
const recoverPasswordRoute = '/recover-password';
const rootRoute = '/';

const incorrectCredentialsMessage = 'Oops! Incorrect username or password';
const pageNotFoundMessage = "Oops! The requested page doesn't exist.";
const passwordsNotMatchingMessage = "Sorry! The typed passwords don't match";
const routeNotFoundMessage = "Oops! The requested page doesn't exist.";

const verifyLoginCredentials = (username, password, rememberMe, postResponse) => {
    // creating a connection to the database
    mongoClient.connect(databaseURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        // database name
        const databaseObject = db.db('loginDB');
        assert.strictEqual(null, err);

        // searching the username in the database
        databaseObject.collection(usersCollectionName).find({ username: username }).limit(1).count().then((number) => {
            // if the username has been found
            if (number != 0) {
                databaseObject.collection(usersCollectionName).findOne({ username: username }, (err, result) => {
                    assert.strictEqual(null, err);

                    bcrypt.compare(password, result.password, (err3, result2) => {
                        if (result2 === true) {
                            postResponse.cookie('user_id', result._id.toString(), rememberMe === 'on' ? { maxAge: 600000, overwrite: true } : { overwrite: true });

                            postResponse.cookie('username', username, rememberMe === 'on' ? { maxAge: 600000, overwrite: true } : { overwrite: true });

                            postResponse.cookie('auth_type', 'login', rememberMe === 'on' ? { maxAge: 600000, overwrite: true } : { overwrite: true });

                            // redirecting to the homepage route
                            postResponse.redirect(homeRoute);
                        }
                        // redirecting to the incorrect credentials route if the passwords don't match
                        else {
                            postResponse.redirect(incorrectCredentialsRoute);
                        }
                    });
                })
            }
            // if the username hasn't been found, redirecting to the incorrect credentials route
            else {
                postResponse.redirect(incorrectCredentialsRoute);
            }
        });
    });
}

const verifyRegisterCredentials = (username, password, postResponse) => {
    // creating a connection to the database
    mongoClient.connect(databaseURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        // database name
        const databaseObject = db.db('loginDB');

        assert.strictEqual(null, err);

        // searching the username in the database
        databaseObject.collection(usersCollectionName).find({ username: username }).limit(1).count().then((number) => {
            // if the username has been found, redirecting to the incorrect credentials route
            if (number != 0) {
                postResponse.redirect(incorrectCredentialsRoute);
            }
            // if the username doesn't exist into the database
            else {
                bcrypt.hash(password, saltRounds, (error, hash) => {
                    // inserting the new user
                    databaseObject.collection(usersCollectionName).insertOne({ username: username, password: hash }, (err1, result) => {
                        assert.strictEqual(null, err1);
                        postResponse.cookie('auth_type', 'register', { overwrite: true });
                        postResponse.cookie('username', username, { overwrite: true });
                        // redirecting to the homepage route
                        postResponse.redirect(homeRoute);
                        // closing the connection to the database
                        db.close();
                    });
                });
            }
        });
    });
}

const recoverPassword = (username, newPassword, confirmPassword, postResponse) => {
    // creating a connection to the database
    mongoClient.connect(databaseURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        // database name
        const databaseObject = db.db('loginDB');

        assert.strictEqual(null, err);

        // searching the username in the database
        databaseObject.collection(usersCollectionName).find({ username: username }).limit(1).count().then((number) => {
            // if the username has been found
            if (number != 0) {
                bcrypt.hash(newPassword, saltRounds, (error, newPasswordHash) => {
                    // if the two typed passwords match
                    if (newPassword === confirmPassword) {
                        // updating user's password
                        databaseObject.collection(usersCollectionName).updateOne({ username: username }, { $set: { password: newPasswordHash } }, (error1, result) => {
                            assert.strictEqual(null, error1);
                            // redirecting to the login route
                            postResponse.redirect(loginRoute);
                        });
                    }
                    // if the two typed passwords don't match, redirecting to the passwords don't match route
                    else {
                        postResponse.redirect(passwordsNotMatchingRoute);
                    }
                });
            }
            // if the username doesn't exist into the database
            else {
                postResponse.redirect(incorrectCredentialsRoute);
            }
        });
    });
}

export {
    assert,
    mongoClient,
    databaseURL,
    usersCollectionName,
    homeRoute,
    incorrectCredentialsRoute,
    loginRoute,
    logoutRoute,
    passwordsNotMatchingRoute,
    recoverPasswordRoute,
    rootRoute,
    incorrectCredentialsMessage,
    pageNotFoundMessage,
    passwordsNotMatchingMessage,
    routeNotFoundMessage,
    verifyLoginCredentials,
    verifyRegisterCredentials,
    recoverPassword
};