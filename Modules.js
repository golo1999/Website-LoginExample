const express=require("express");
const app=express();
const port=3000;
const path=require("path").dirname(require.main.filename);
const bodyParser=require("body-parser");
const mongo=require("mongodb");
const mongoClient=mongo.MongoClient;
const dbURL="mongodb://localhost:127.0.0.1:27017/users";
const session=require("express-session");

app.use("/assets", express.static(__dirname+'/assets'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));
app.set("view engine", "ejs");

function verifyLoginCredentials(username, password, rememberMe, postResponse, postRequest)
{   
    if(rememberMe==="on")
        console.log("Remember me is ON");
    else console.log("Remember me is OFF");

    mongoClient.connect(dbURL, (err, db) => 
    {
        // if(err) throw err;
        const dbObject=db.db("loginDB");
        // dbObject.collection("users").insertOne({username: username, password: password}, (err, res) =>
        // {
        //     if(err) throw err;
        //     console.log("1 document inserted");
        //     db.close();
        // });

        dbObject.collection("users").find({username: username}).limit(1).count().then((number) => 
        {
            if(number!=0)
            {
                console.log("The username has been found");
                dbObject.collection("users").findOne({username: username}, (err, result) =>
                {
                    if(err) throw err;
                    if(result.password===password)
                    {
                        let addRememberMe=rememberMe==="on" ? "on" : "off";

                        if(addRememberMe!==result.remember_me)
                        {
                            dbObject.collection("users").updateOne({username: username}, {$set: {remember_me: addRememberMe}}, (err, result) =>
                            {
                                if(err) throw err;
                                console.log(("Remember me has been updated"));
                            });
                        }

                        console.log("The passwords match. Hello");
                        postRequest.session.username=username;
                        postRequest.session.auth_type="login";
                        postResponse.redirect("/home");
                    }
                    else
                    {
                        console.log("Sorry, the passwords don't match");
                        postResponse.redirect("/");
                    }
                })
            }
            else
            {
                console.log("The username doesn't exist");
                postResponse.redirect("/");
            }
        });

        // dbObject.collection("users").findOne({username: username}, (err, result) =>
        // {
        //     if(err) throw err;
        //     if(result.password===password)
        //         console.log(result.username+" "+result.password);
        //     else console.log("not matching");
        //     db.close();
        // });
    });
}

function verifyRegisterCredentials(username, password, postResponse, postRequest)
{
    mongoClient.connect(dbURL, (err, db) =>
    {
        const dbObject=db.db("loginDB");

        if(err) throw err;
        
        dbObject.collection("users").find({username: username}).limit(1).count().then((number) => 
        {
            if(number!=0)
                console.log("The username already exists");
            // else
            // {
            //     let addRememberMe=rememberMe==="on" ? "on" : "off";

            //     dbObject.collection("users").insertOne({username: username, password: password, remember_me: addRememberMe}, (err, res) =>
            //     {
            //         if(err) throw err;
            //         console.log("user registered successfully");
            //         postRequest.session.username=username;
            //         postRequest.session.auth_type="register";
            //         postResponse.redirect("/home");
            //         db.close();
            //     });
            // }
            else
            {
                dbObject.collection("users").insertOne({username: username, password: password, remember_me: "off"}, (err, res) =>
                {
                    if(err) throw err;
                    console.log("user registered successfully");
                    postRequest.session.username=username;
                    postRequest.session.auth_type="register";
                    postResponse.redirect("/home");
                    db.close();
                });
            }
        });
    });
}

app.get("/", function(req, res)
{
    res.redirect("/login");
});

app.get("/home", function(req, res)
{
    //res.sendFile(path+'/homePage.html');
    res.render("home", {username: req.session.username, auth_type: req.session.auth_type});
});

app.get("/login", function(req, res)
{
    res.sendFile(path+'/login.html');
});

app.get("/register", function(req, res)
{
    res.sendFile(path+'/register.html');
});

app.post("/", function(req, res)
{
    console.log(req.body);

    switch(req.body.button)
    {
        case 'Register':
            verifyRegisterCredentials(req.body.username, req.body.password, res, req);
            break;
        case 'Sign in':
            verifyLoginCredentials(req.body.username, req.body.password, req.body.remember_checkbox, res, req);
            break;
    }

    // if(req.body.button==='Register')
    // {
    //     verifyRegisterCredentials(req.body.username, req.body.password, req.body.remember_checkbox, res, req);
    //     //res.redirect("/");
    // }
    // else if(req.body.button==='Sign in')
    // {
    //     verifyLoginCredentials(req.body.username, req.body.password, req.body.remember_checkbox, res, req);
    //     //console.log(req.body.username+" "+req.body.password);
    //         //res.redirect("/home");
    // }
});

app.listen(port);