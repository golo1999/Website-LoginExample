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

verifyLoginCredentials = (username, password, rememberMe, postResponse) =>
{   
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
                            postResponse.redirect("/home"); // redirecting to the homepage route
                        }
                        else // if the passwords don't match
                        {
                            console.log("Sorry, the passwords don't match"); // testing
                            postResponse.redirect("/"); // redirecting back to the start route
                        }
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

verifyRegisterCredentials = (username, password, postResponse) =>
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
                    dbObject.collection("users").insertOne({username: username, password: hash}, (err1, result) => // inserting the new user
                    {
                        assert.strictEqual(null, err1);
                        console.log("user registered successfully");
                        postResponse.cookie('auth_type', 'register', {overwrite: true});
                        postResponse.cookie('username', username, {overwrite: true});
                        postResponse.redirect("/home"); // redirecting to the homepage route
                        db.close(); // closing the connection to the database
                    });
                });         
            }
        });
    });
}

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
        res.redirect("/login");
    }
    else // if not all the cookies exist
    {
        res.sendFile(path+'/login.html');
    }
});

app.post("/", (req, res) => // start post route
{
    console.log(req.body); // testing

    switch(req.body.button) // checking which button was pressed
    {
        case 'Register':
            verifyRegisterCredentials(req.body.username, req.body.password, res);
            break;
        case 'Sign in':
            verifyLoginCredentials(req.body.username, req.body.password, req.body.remember_checkbox, res);
            break;
    }
});

app.listen(port); // starting the server on the specified port