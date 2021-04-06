const express=require("express");
const app=express();
const cookieParser=require("cookie-parser");
const noCache=require("nocache");
const port=3000 || process.env.PORT;
const path=require("path").dirname(require.main.filename);
const mongo=require("mongodb");
const mongoClient=mongo.MongoClient;
const assert=require("assert");
const bcrypt=require("bcrypt");
const saltRounds=10;
const dbURL="mongodb://localhost:127.0.0.1:27017/users";
const session=require("express-session");

app.use("/assets", express.static(__dirname+'/assets'));
app.use(express.urlencoded({extended: true}));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));
app.use(noCache());
app.use(cookieParser());
app.set("view engine", "ejs");

function verifyLoginCredentials(username, password, rememberMe, postResponse, postRequest)
{   
    // if(rememberMe==="on") // testing
    //     console.log("Remember me is ON");
    // else console.log("Remember me is OFF");

    mongoClient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => // creating a connection to the database
    {
        const dbObject=db.db("loginDB"); // database name
        assert.strictEqual(null, err);

        dbObject.collection("users").find({username: username}).limit(1).count().then((number) => // searching the username in the database
        {
            if(number!=0) // if the username has been found
            {
                console.log("The username has been found"); // testing
                dbObject.collection("users").findOne({username: username}, (err, result) =>
                {
                    assert.strictEqual(null, err);

                    bcrypt.compare(password, result.password, (err3, result2) =>
                    {
                        if(result2===true)
                        {
                            if(rememberMe==="on")
                            {
                                postResponse.cookie('user_id', result._id.toString(), {maxAge: 600000, overwrite: true});
                                postResponse.cookie('username', username, {maxAge: 600000, overwrite: true});
                                postResponse.cookie('auth_type', 'login', {maxAge: 600000, overwrite: true});
                            }
                            else
                            {
                                postResponse.cookie('user_id', result._id.toString(), {overwrite: true});
                                postResponse.cookie('username', username, {overwrite: true});
                                postResponse.cookie('auth_type', 'login', {overwrite: true});
                            }

                            console.log("The passwords match. Hello"); // testing
                            postRequest.session.username=username; // putting the username into a session variable named username (used in home.ejs)
                            postRequest.session.auth_type="login"; // putting the authentication type into a session variable named auth_type (used in home.ejs)
                            postResponse.redirect("/home"); // redirecting to the homepage route
                        }
                        else // if the passwords don't match
                        {
                            console.log("Sorry, the passwords don't match"); // testing
                            postResponse.redirect("/"); // redirecting back to the start route
                        }

                        // if(result2===true)
                        // {
                        //     const addRememberMe=rememberMe==="on" ? "on" : "off"; // if we checked the 'Remember me' checkbox

                        //     if(addRememberMe!==result.remember_me) // if the selected 'Remember me' value is different from the database one
                        //     {
                        //         dbObject.collection("users").updateOne({username: username}, {$set: {remember_me: addRememberMe}}, (err) => // updating the 'Remember me' into the database
                        //         {
                        //             assert.strictEqual(null, err);
                        //             console.log(("Remember me has been updated")); // testing
                        //         });
                        //     }
    
                        //     console.log("The passwords match. Hello"); // testing
                        //     postRequest.session.username=username; // putting the username into a session variable named username (used in home.ejs)
                        //     postRequest.session.auth_type="login"; // putting the authentication type into a session variable named auth_type (used in home.ejs)
                        //     postResponse.redirect("/home"); // redirecting to the homepage route
                        // }
                        // else // if the passwords don't match
                        // {
                        //     console.log("Sorry, the passwords don't match"); // testing
                        //     postResponse.redirect("/"); // redirecting back to the start route
                        // }
                    });
                })
            }
            else // if the username hasn't been found
            {
                console.log("The username doesn't exist"); // testing
                postResponse.redirect("/"); // redirecting back to the start route
            }
        });
    });
}

function verifyRegisterCredentials(username, password, postResponse, postRequest)
{
    mongoClient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => // creating a connection to the database
    {
        const dbObject=db.db("loginDB"); // database name

        assert.strictEqual(null, err);
        
        dbObject.collection("users").find({username: username}).limit(1).count().then((number) => // searching the username in the database
        {
            if(number!=0) // if the username has been found
            {
                console.log("The username already exists"); // testing
                postResponse.redirect("/");
            }
            else // if the username doesn't exist into the database
            {
                bcrypt.hash(password, saltRounds, (error, hash) =>
                {
                    //assert.strictEqual(null, error);
                    dbObject.collection("users").insertOne({username: username, password: hash, remember_me: "off"}, (err1, result) => // inserting the new user
                    {
                        assert.strictEqual(null, err1);
                        console.log("user registered successfully");
                        postResponse.cookie('auth_type', 'register', {overwrite: true});
                        postResponse.cookie('username', username, {overwrite: true});
                        postRequest.session.username=username; // putting the username into a session variable named username (used in home.ejs)
                        postRequest.session.auth_type="register"; // putting the authentication type into a session variable named auth_type (used in home.ejs)
                        postResponse.redirect("/home"); // redirecting to the homepage route
                        db.close(); // closing the connection to the database
                    });
                });         
            }
        });
    });
}

// function noCache(req, res, next)
// {
//     res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//     res.header('Expires', '-1');
//     res.header('Pragma', 'no-cache');
//     next();
// }

app.get("/", (req, res) => // start route
{
    res.redirect("/login");
});

app.get("/home", (req, res) => // home page route
{
    const {cookies}=req;
    if("username" in cookies && "auth_type" in cookies) // if the two cookies exist
        res.render("home", {username: cookies.username, auth_type: cookies.auth_type}); // sending the variables to the home.ejs to be rendered
    else res.redirect("/login"); // if the two cookies doesn't exist
});

app.get("/login", (req, res) => // login route
{
    const {cookies}=req;
    if("user_id" in cookies && "username" in cookies && "auth_type" in cookies) // if the three cookies exist
    {
        console.log("USER ID COOKIE FOUND");
        console.log("USERNAME COOKIE FOUND");
        console.log("AUTH_TYPE COOKIE FOUND");
        mongoClient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => // creating a connection to the database
        {
            const dbObject=db.db("loginDB"); // database name

            assert.strictEqual(null, err);
            dbObject.collection("users").findOne({username: cookies.username}, {username: 1}, (err1, result) =>
            {
                assert.strictEqual(null, err1);
                if(result._id.toString()===cookies.user_id) // if the cookie id is equal to the database user id
                {
                    console.log("THE IDS ARE THE SAME");
                    res.redirect("/home");
                }
                else res.sendFile(path+'/login.html');
            });
        });      
    }
    else // if not all the cookies exist
    {
        console.log("user id cookie NOT found");
        console.log("username cookie not found");
        res.sendFile(path+'/login.html');
    }
});

app.get("/logout", (req, res) => // logout route
{
    const {cookies}=req;
    if("user_id" in cookies && "username" in cookies && "auth_type" in cookies) // if the three cookies exist
    {
        res.clearCookie('user_id');
        res.clearCookie('username');
        res.clearCookie('auth_type');
        // res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        // res.header('Expires', '-1');
        // res.header('Pragma', 'no-cache');
        res.redirect("/login");
    }
    else // if not all the cookies exist
    {
        res.sendFile(path+'/login.html');
    }
});

app.get("/register", (req, res) => // register route (not used)
{
    res.sendFile(path+'/register.html');
});

app.post("/", (req, res) => // start post route
{
    console.log(req.body); // testing

    switch(req.body.button) // checking which button was pressed
    {
        case 'Register':
            verifyRegisterCredentials(req.body.username, req.body.password, res, req);
            break;
        case 'Sign in':
            verifyLoginCredentials(req.body.username, req.body.password, req.body.remember_checkbox, res, req);
            break;
    }
});

app.listen(port); // starting the server on the specified port