var Campground = require("../models/campground"),
    Comment    = require("../models/comment");

//all the middleware
var middlewareobj={};

    middlewareobj.campgroundownership=function (req, res, next) {
        //is someone user logged in
        if (req.isAuthenticated()) {
            Campground.findById(req.params.id, (err, foundCampground) => {
                if (err) {
                    req.flash("error", "Not found!")
                    res.redirect("back");
                } else {
                    //does user owned that post
                    if (foundCampground.author.id.equals(req.user._id)) {
                        next();
                    } else {
                        req.flash("error", "Not authorized to do that!")
                        res.redirect("back");
                    }
                }
            });
        } else {
            req.flash("error","You need to be logged in to do that!")
            res.redirect("back");
        }

    };

    middlewareobj.commentownership=function (req, res, next) {
        //is someone user logged in
        if (req.isAuthenticated()) {
            Comment.findById(req.params.comment_id, (err, foundComment) => {
                if (err) {
                    res.redirect("back");
                } else {
                    //does user owned that comment?
                    if (foundComment.author.id.equals(req.user._id)) {
                        next();
                    } else {
                        req.flash("error", "Not authorized to do that!")
                        res.redirect("back");
                    }
                }
            });
        } else {
            req.flash("error", "You need to be logged in to do that!")
            res.redirect("back");
        }

    };

    middlewareobj.isLoggedIn=function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("/login");
    };


module.exports=middlewareobj;