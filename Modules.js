import * as utility from './utility.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import noCache from 'nocache';
import { fileURLToPath } from 'url';
import { dirname as folderPath } from 'path';
import session from 'express-session';

const app = express();
const port = 3000 || process.env.PORT;
const __filename = fileURLToPath(
    import.meta.url);

const databaseURL = utility.databaseURL;

app.use('/assets', express.static(folderPath(__filename) + '/assets'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));
app.use(noCache());
app.use(cookieParser());
app.set('view engine', 'ejs');

// root get route
app.get(utility.rootRoute, (req, res) => {
    res.redirect(utility.loginRoute);
});

// home page route
app.get(utility.homeRoute, (req, res) => {
    const { cookies } = req;
    // sending the variables to the home.ejs to be rendered if the two cookies exist
    // else redirecting to the login route
    ('username' in cookies && 'auth_type' in cookies) ?
    res.render('home', { username: cookies.username, auth_type: cookies.auth_type }):
        res.redirect(utility.loginRoute);
});

// login route
app.get(utility.loginRoute, (req, res) => {
    const { cookies } = req;
    // if the three cookies exist
    if ('user_id' in cookies && 'username' in cookies && 'auth_type' in cookies) {
        // creating a connection to the database
        utility.mongoClient.connect(databaseURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
            // database name
            const databaseObject = db.db('loginDB');

            utility.assert.strictEqual(null, err);
            databaseObject.collection(utility.usersCollectionName).findOne({ username: cookies.username }, { username: 1 }, (err1, result) => {
                utility.assert.strictEqual(null, err1);
                // redirecting to the home route if the cookie id is equal to the database user id
                // else redirecting to the login route
                result._id.toString() === cookies.user_id ?
                    res.redirect(utility.homeRoute) : res.sendFile('/login.html', { root: folderPath(__filename) });
            });
        });
    }
    // redirecting to the login route if at least one cookie doesn't exist
    else {
        res.sendFile('/login.html', { root: folderPath(__filename) });
    }
});

// logout route
app.get(utility.logoutRoute, (req, res) => {
    const { cookies } = req;
    // if the three cookies exist
    if ('user_id' in cookies && 'username' in cookies && 'auth_type' in cookies) {
        res.clearCookie('user_id');
        res.clearCookie('username');
        res.clearCookie('auth_type');
        res.redirect(utility.loginRoute);
    }
    // if not all the cookies exist (or no cookie exists at all)
    else {
        res.sendFile('/login.html', { root: folderPath(__filename) });
    }
});

// recover password route
app.get(utility.recoverPasswordRoute, (req, res) => {
    res.sendFile('/recover.html', { root: folderPath(__filename) });
});

// incorrect credentials route
app.get(utility.incorrectCredentialsRoute, (req, res) => {
    res.render('notFound', { message: utility.incorrectCredentialsMessage, error: 400 });
});

// passwords don't match route
app.get(utility.passwordsNotMatchingRoute, (req, res) => {
    res.render('notFound', { message: utility.passwordsNotMatchingMessage, error: 400 });
});

// root post route
app.post(utility.rootRoute, (req, res) => {
    // checking which button was pressed
    switch (req.body.button) {
        case 'Register':
            utility.verifyRegisterCredentials(req.body.username, req.body.password, res);
            break;
        case 'Sign in':
            utility.verifyLoginCredentials(req.body.username, req.body.password, req.body.remember_checkbox, res);
            break;
    }
});

// recover password post route
app.post(utility.recoverPasswordRoute, (req, res) => {
    utility.recoverPassword(req.body.username, req.body.new_password, req.body.confirm_password, res);
});

// everything else route
app.get('*', (req, res) => {
    res.render('notFound', { message: utility.routeNotFoundMessage, error: 404 });
});

// starting the server on the specified port
app.listen(port);