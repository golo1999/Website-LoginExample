const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const noCache = require('nocache');
const port = 3000 || process.env.PORT;
const path = require('path').dirname(require.main.filename);
const mongo = require('mongodb');
const mongoClient = mongo.MongoClient;
const assert = require('assert');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const dbURL = 'mongodb://localhost:127.0.0.1:27017/users';
const session = require('express-session');

app.use('/assets', express.static(__dirname + '/assets'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));
app.use(noCache());
app.use(cookieParser());
app.set('view engine', 'ejs');

verifyLoginCredentials = (username, password, rememberMe, postResponse) => {
    // creating a connection to the database
    mongoClient.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        // database name
        const dbObject = db.db('loginDB');
        assert.strictEqual(null, err);

        // searching the username in the database
        dbObject.collection('users').find({ username: username }).limit(1).count().then((number) => {
            // if the username has been found
            if (number != 0) {
                dbObject.collection('users').findOne({ username: username }, (err, result) => {
                    assert.strictEqual(null, err);

                    bcrypt.compare(password, result.password, (err3, result2) => {
                        if (result2 === true) {
                            postResponse.cookie('user_id', result._id.toString(), rememberMe === 'on' ?
                                { maxAge: 600000, overwrite: true } : { overwrite: true }
                            );

                            postResponse.cookie('username', username, rememberMe === 'on' ?
                                { maxAge: 600000, overwrite: true } : { overwrite: true }
                            );

                            postResponse.cookie('auth_type', 'login', rememberMe === 'on' ?
                                { maxAge: 600000, overwrite: true } : { overwrite: true }
                            );

                            // redirecting to the homepage route
                            postResponse.redirect('/home');
                        }
                        // if the passwords don't match, redirecting to the incorrect credentials route
                        else {
                            postResponse.redirect('/incorrect-credentials');
                        }
                    });
                })
            }
            // if the username hasn't been found, redirecting to the incorrect credentials route
            else {
                postResponse.redirect('/incorrect-credentials');
            }
        });
    });
}

verifyRegisterCredentials = (username, password, postResponse) => {
    // creating a connection to the database
    mongoClient.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        // database name
        const dbObject = db.db('loginDB');

        assert.strictEqual(null, err);

        // searching the username in the database
        dbObject.collection('users').find({ username: username }).limit(1).count().then((number) => {
            // if the username has been found, redirecting to the incorrect credentials route
            if (number != 0) {
                postResponse.redirect('/incorrect-credentials');
            }
            // if the username doesn't exist into the database
            else {
                bcrypt.hash(password, saltRounds, (error, hash) => {
                    // inserting the new user
                    dbObject.collection('users').insertOne({ username: username, password: hash }, (err1, result) => {
                        assert.strictEqual(null, err1);
                        postResponse.cookie('auth_type', 'register', { overwrite: true });
                        postResponse.cookie('username', username, { overwrite: true });
                        // redirecting to the homepage route
                        postResponse.redirect('/home');
                        // closing the connection to the database
                        db.close();
                    });
                });
            }
        });
    });
}

recoverPassword = (username, newPassword, confirmPassword, postResponse) => {
    // creating a connection to the database
    mongoClient.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        // database name
        const dbObject = db.db('loginDB');

        assert.strictEqual(null, err);

        // searching the username in the database
        dbObject.collection('users').find({ username: username }).limit(1).count().then((number) => {
            // if the username has been found
            if (number != 0) {
                bcrypt.hash(newPassword, saltRounds, (error, newPasswordHash) => {
                    // if the two typed passwords match
                    if (newPassword === confirmPassword) {
                        // updating user's password
                        dbObject.collection('users')
                            .updateOne({ username: username }, { $set: { password: newPasswordHash } },
                                (error1, result) => {
                                    assert.strictEqual(null, error1);
                                    // redirecting to the login route
                                    postResponse.redirect('/login');
                                });
                    }
                    // if the two typed passwords don't match, redirecting to the passwords don't match route
                    else {
                        postResponse.redirect('/passwords-dont-match');
                    }
                });
            }
            // if the username doesn't exist into the database
            else {
                postResponse.redirect('/incorrect-credentials');
            }
        });
    });
}

// root get route
app.get('/', (req, res) => {
    res.redirect('/login');
});

// home page route
app.get('/home', (req, res) => {
    const { cookies } = req;
    // if the two cookies exist
    if ('username' in cookies && 'auth_type' in cookies) {
        // sending the variables to the home.ejs to be rendered
        res.render('home', { username: cookies.username, auth_type: cookies.auth_type });
    }
    // if the two cookies doesn't exist
    else {
        res.redirect('/login');
    }
});

// login route
app.get('/login', (req, res) => {
    const { cookies } = req;
    // if the three cookies exist
    if ('user_id' in cookies && 'username' in cookies && 'auth_type' in cookies) {
        // creating a connection to the database
        mongoClient.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
            // database name
            const dbObject = db.db('loginDB');

            assert.strictEqual(null, err);
            dbObject.collection('users').findOne({ username: cookies.username }, { username: 1 }, (err1, result) => {
                assert.strictEqual(null, err1);
                // if the cookie id is equal to the database user id
                if (result._id.toString() === cookies.user_id) {
                    res.redirect('/home');
                }
                else {
                    res.sendFile(path + '/login.html');
                }
            });
        });
    }
    // if not all the cookies exist, redirecting to the login route
    else { res.sendFile(path + '/login.html'); }
});

// logout route
app.get('/logout', (req, res) => {
    const { cookies } = req;
    // if the three cookies exist
    if ('user_id' in cookies && 'username' in cookies && 'auth_type' in cookies) {
        res.clearCookie('user_id');
        res.clearCookie('username');
        res.clearCookie('auth_type');
        res.redirect('/login');
    }
    // if not all the cookies exist (or no cookie exists at all)
    else {
        res.sendFile(path + '/login.html');
    }
});

// recover password route
app.get('/recover-password', (req, res) => {
    res.sendFile(path + '/recover.html');
});

// incorrect credentials route
app.get('/incorrect-credentials', (req, res) => {
    res.render('notFound', { message: 'Oops! Incorrect username or password', error: 400 });
});

// passwords don't match route
app.get('/passwords-dont-match', (req, res) => {
    res.render('notFound', { message: "Sorry! The typed passwords don't match", error: 400 });
});

// root post route
app.post('/', (req, res) => {
    switch (req.body.button) // checking which button was pressed
    {
        case 'Register':
            verifyRegisterCredentials(req.body.username, req.body.password, res);
            break;
        case 'Sign in':
            verifyLoginCredentials(req.body.username, req.body.password, req.body.remember_checkbox, res);
            break;
    }
});

// recover password post route
app.post('/recover-password', (req, res) => {
    recoverPassword(req.body.username, req.body.new_password, req.body.confirm_password, res);
});

// everything else route
app.get('*', (req, res) => {
    res.render('notFound', { message: "Oops! The requested page doesn't exist.", error: 404 });
});

// starting the server on the specified port
app.listen(port);