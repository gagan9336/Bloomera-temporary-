var express    = require("express"),
    router     = express.Router(),
    Campground = require("../models/campground"),
    middleware = require("../middleware/index"),
    User       = require("../models/user"),
    moment     = require("moment"),
    NodeGeocoder = require('node-geocoder'),
    multer = require('multer'),
    cloudinary = require('cloudinary');

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

cloudinary.config({ 
  cloud_name: 'gagan9336', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

    //Campground search user
    // router.get("/campGround/search", async (req, res) => {
    //     let searchOptions = {}
    //     if (req.query.searchUser != null && req.query.searchUser !== "") {
    //         searchOptions = { username: RegExp(req.query.searchUser, "i") }
    //     }
    //     try {
    //         const findUser = await User.find(searchOptions)
    //         res.render("campgrounds/search", {
    //             findUser: findUser,
    //             searchOptions: req.query
    //         });
    //     } catch{
    //         res.redirect("/");
    //     }
    // });

   // all campground and search feature
    router.get("/campGround", (req, res) => {
       if(req.query.search){
           const regex= new RegExp(escapeRegex(req.query.search),"gi");
           Campground.find({ name: regex }, (err, allcampground) => {
               if (err) {
                   console.log(err);
               } else {
                   res.render("campgrounds/index", { campGround:allcampground,
                     currentUser: req.user,
                     });
               }
           })
       }else{
           Campground.find({}, (err, allcampground) => {
               if (err) {
                   console.log(err);
               } else {
                   res.render("campgrounds/index", { campGround: allcampground, currentUser: req.user });
               }
           })
       }
    });
    
    function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\$&");        
    };
     
    //Create route
    router.post("/campGround",middleware.isLoggedIn, upload.single('image'), (req, res) => {
        var name = req.body.name;
        var description = req.body.description;
        var author={
            id: req.user._id,
            username: req.user.username,
            createdAt: moment(new Date().getTime()).format('LLL')
        }
        

    cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
    // add cloudinary url for the image to the campground object under image property
    if(err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
    geocoder.geocode(req.body.location, (err, data) => {
                if(err || !data.length) {
                    console.log(err);
                    req.flash('error', 'Invalid address');
                    return res.redirect('back');
                    
                }
                var lat = data[0].latitude;
                var lng = data[0].longitude;
                var location = data[0].formattedAddress;

                var newcampGround = {
                name: name,
                image: result.secure_url,
                image_id: result.public_id,
                description: description,
                author: author,
                location: location,
                lat: lat,
                lng: lng
            }
            // create a new campground an save in the database
            Campground.create(newcampGround, (err, newlyCreated) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/campGround");
                }
            })
        })
    });

        
            
    });
    router.get("/campGround/search-post", (req, res) => {
        res.render("campgrounds/search-post");
    })
    //new route
    router.get("/campGround/new",middleware.isLoggedIn, (req, res) => {
        res.render("campgrounds/new");
    });

    //show- show more info about campground
    router.get("/campGround/:id", (req, res) => {
        Campground.findById(req.params.id).populate("comments").exec(function (err, foundCamp) {
            if (err) {
                console.log(err);
            } else {
                //render show template with the campground
                res.render("campgrounds/show", { campground: foundCamp });
            }
        });
    });

    //edit campground
    router.get("/campGround/:id/edit",middleware.campgroundownership,(req,res)=>{
        Campground.findById(req.params.id,(err,foundCampground)=>{
            res.render("campgrounds/edit",{campground:foundCampground});
        })

    });

// PUT - updates campground in the database
router.put("/campGround/:id", middleware.campgroundownership, upload.single('image'), function(req, res){
   Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else{
            if(req.file){
                try{
                    await cloudinary.v2.uploader.destroy(campground.image_id);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.image = result.secure_url;
                    campground.imageId = result.public_id;
                } catch(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            if(req.body.location !== campground.location){
                try{
                    var updatedLocation = await geocoder.geocode(req.body.location);
                    campground.lat = updatedLocation[0].latitude;
                    campground.lng = updatedLocation[0].longitude;
                    campground.location = updatedLocation[0].formattedAddress;
                } catch(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.save();
            req.flash("success", "Successfully Updated!");
            res.redirect("/campGround/" + campground._id);
        }
    });
});

    //delete route
    router.delete("/campGround/:id", middleware.campgroundownership,(req,res)=>{
       Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(campground.image_id);
        campground.remove();
        res.redirect('/campGround');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
    });

    module.exports=router;