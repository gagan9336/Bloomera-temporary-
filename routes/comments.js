var express    = require("express"),
    router     = express.Router(),
    Campground = require("../models/campground"),
    Comment    = require("../models/comment");
    middleware = require("../middleware/index");
    moment   = require("moment");

    //comments new
    router.get("/campGround/:id/comments/new", middleware.isLoggedIn, (req, res) => {
        //find campground by id
        Campground.findById(req.params.id, (err, campground) => {
            if (err) {
                console.log(err);
            } else {
                res.render("comments/new", { campground: campground });
            }
        })
    })

    //comments create
    router.post("/campground/:id/comments", middleware.isLoggedIn, (req, res) => {
        //lookup campground using id
        Campground.findById(req.params.id, (err, campground) => {
            if (err) {
                req.flash("error", "Something went wrong!")
                console.log(err);
                res.redirect("/campGrounds");
            } else {
                //create new comment
                Comment.create(req.body.comment, (err, comment) => {
                    if (err) {
                        console.log(err);
                    } else {
                        //add username and id and save
                        comment.author.id=req.user._id;
                        comment.author.username=req.user.username;
                        comment.author.createdAt = moment(new Date().getTime()).format('LLL')
                        //connect new comment to campground
                        comment.save();
                        campground.comments.push(comment);
                        campground.save();
                        //redirect to show
                        req.flash("success", "Successfully added comment!")
                        res.redirect("/campGround/" + campground._id);
                    }
                })
            }
        })
    });

    //edit comment route
    router.get("/campground/:id/comments/:comment_id/edit", middleware.commentownership,(req,res)=>{
        Comment.findById(req.params.comment_id,(err,foundcomment)=>{
            if(err){
                res.redirect("back");
            }else{
                res.render("comments/edit",{campground_id: req.params.id, comment:foundcomment});
            }
        })
    })

    //comment update
    router.put("/campGround/:id/comments/:comment_id", middleware.commentownership,(req,res)=>{
        Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,(err,updatedcomment)=>{
            if(err){
                res.redirect("back");
            }else{
                res.redirect("/campGround/" + req.params.id);
            }
        })
    })

    //comment destroy route
    router.delete("/campGround/:id/comments/:comment_id", middleware.commentownership,(req,res)=>{
        Comment.findByIdAndRemove(req.params.comment_id,(err,deletecomment)=>{
            if (err) {
                res.redirect("/campGround");
            } else {
                req.flash("success", "Comment deleted!")
                res.redirect("/campGround/"+ req.params.id);
            }
        })
    })

module.exports=router;