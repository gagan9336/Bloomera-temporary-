var express        = require("express"),
    app            = express(),
    passport       = require("passport"),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    flash = require("connect-flash"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override");
    Campground     = require("./models/campground"),
    Comment        = require("./models/comment"),
    User           = require("./models/user"),

require('dotenv').config();

//requiring routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campground"),
    indexRoutes      = require("./routes/index");

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URL, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false});

    app.set("view engine", "ejs");
    app.use(express.urlencoded({extended:true}));
    app.use(express.static(__dirname+"/public/"));
    app.use(methodOverride("_method"));


    app.use(require("express-session")({
        secret:"ONE AGAIN RUSTY WINS CUTEST DOG",
        resave:false,
        saveUninitialized:false
    }));

    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(User.createStrategy());
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    //======================

    //adding current user info
    app.use((req,res,next)=>{
        res.locals.currentUser=req.user;
        res.locals.success = req.flash("success");
        res.locals.error= req.flash("error");
        next();
    })

    //adding routes
    app.use(indexRoutes);
    app.use(campgroundRoutes);
    app.use(commentRoutes);

    //port
    app.listen(PORT, () => {
        console.log(`The Server Started at Port ${PORT}`);
    });