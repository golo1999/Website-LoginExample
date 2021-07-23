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
    import.meta.url
);

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
    // sending the variables to the home.ejs to be rendered if the two cookies exist and redirecting the user to home route
    // else redirecting to the login route
    ('username' in cookies && 'auth_type' in cookies) ?
    res.render('home', { username: cookies.username, auth_type: cookies.auth_type }): res.redirect(utility.loginRoute);
});

// login route
app.get(utility.loginRoute, (req, res) => {
    utility.verifyIfUserIsAlreadyAuthenticated(req, res);
});

// logout route
app.get(utility.logoutRoute, (req, res) => {
    utility.logoutUser(req, res);
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