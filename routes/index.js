const { route } = require("./campground");

var express    = require("express"),
    router     = express.Router(),
    passport   = require("passport"),
    User       = require("../models/user"),
    middleware = require("../middleware/index");
    async      = require("async"),
    nodemailer = require("nodemailer"),
    crypto     = require("crypto"),
    geolocation= require("geolocation");


    //root route
    router.get("/", (req, res) => {
        res.render("landing",);
    });

    //Feadback form
    router.get("/feedback", (req, res) => {
      res.render("feedback");
    });

    router.post("/feedback", (req, res) => {
      var smtpTransport = nodemailer.createTransport({
      service: 'Gmail', 
      auth: {
        user: 'BloomTechTeam@gmail.com',   
        pass: process.env.GMAILPW
        }
      });
      console.log(req.body.email)
      var mailOptions = {
        to: 'BloomTechTeam@gmail.com',
        from: req.body.email,
        subject: 'From Bloomera Site: ' + req.body.subject,
        text: 'This mail is from ' + req.body.username + '.' + ' Email is ' + req.body.email + '. ' + req.body.description
        };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash("success", "Your form is submitted. Our experts will contact you soon.")
        res.redirect("/feedback");
        });
    });

    //auth route
    //=============
    router.get("/register", (req, res) => {
        res.render("register", { message: req.flash("error") });
    })

    //signup logic
    //show register form
    router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username,
        email: req.body.email
    });

    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", "Email or username is invalid");
            console.log(err)
            return res.redirect("register");
        }
      passport.authenticate("local")(req, res, () => {
      var smtpTransport = nodemailer.createTransport({
      service: 'Gmail', 
      auth: {
        user: 'BloomTechTeam@gmail.com',   
        pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'BloomTechTeam@gmail.com',
        subject: 'Welcome To Bloomera',
        html: '<p><h4>We are so happy you decided to join us. Here at Bloomera, we think of ourselves and our users as one big family. And that means helping you get the best experience of this world by reading other users memory blogs.</h4></p><p><h4>We believe in you, that is why we create outrageously memories websites. So lets explore this world of memories together. Thank you for joining</h4></p>'
        };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash("success", "Welcome to Bloomera >"+ user.username)
        res.redirect("/campGround");
        });
      })
    })
  })

    //show login form
    router.get("/login", (req, res) => {        
        res.render("login",{message: req.flash("error")});
    })

    //login route for handeling login logic
    router.post("/login", passport.authenticate("local", {
        successRedirect: "/campGround",
        failureRedirect: "/login",
        failureFlash: true
    }), (req, res) => {

    });

    //logout route
    router.get("/logout", (req, res) => {
        req.logout();
        req.flash("success","logged you out");
        res.redirect("/campGround");
    })

// forgot password
router.get('/campGround/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user || req.body.email == null) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/campGround/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'BloomTechTeam@gmail.com',   
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'BloomTechTeam@gmail.com',
        subject: 'Bloomera Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/campGround/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/campGround/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'bloomtechteam@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'bloomtechteam@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campGround');
  });
});


module.exports=router;