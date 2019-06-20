// Instantiation

var express=require("express");
var exphbs=require("express-handlebars");
var expressSession = require("express-session");
var expValChecker=require("express-validator/check");
var check=expValChecker.check;
var validationResult = expValChecker.validationResult;
var fs=require("fs");
var MongoStore = require("connect-mongo")(expressSession);
var mongoose = require("mongoose");
var passport = require("passport");
var bodyParser = require("body-parser");
var LocalStrategy = require("passport-local");
var OfferModel=require("./models").Offer;
var User = require("./models").User;
var Favorite=require("./models").Favorite;
var multer  = require('multer');
var upload = multer({ dest: 'public/uploads/' });
var app=express();
var port=process.env.PORT||3000;
var mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/lebonplan";

// Connecting to DB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useCreateIndex: true
});

// Middlewares
app.engine('handlebars',exphbs({defaultLayout:'main'}));
app.set("view engine","handlebars");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

// enable session management
app.use(
  expressSession({
    secret: "konexioasso07",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

// enable Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // JSON.stringify
passport.deserializeUser(User.deserializeUser()); // JSON.parse


// Routes
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/admin", function(req, res) {
  if (req.isAuthenticated()) {
    //console.log(req.user);
    res.render("admin");
  } else {
    res.redirect("/");
  }
});

app.get("/signup", function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/admin");
  } else {
    res.render("signup");
  }
});

app.post("/signup", 
  check("username").isEmail(),
  check("password").isLength({ min: 6 }),
  function(req, res) {
    // console.log("req.body", req.body);
    var errors = validationResult(req);
    // console.log("#1", errors.isEmpty());
    if (errors.array().length > 0) {
      // console.log("#2",errors.array());
      res.render('signup', {
      errors: errors.array()
      })
      return;
    }

    console.log("#3");
    // code to add a new user to the DB
    var firstName = req.body.firstName;
    var username=req.body.username;
    var password = req.body.password;
    var conf_password=req.body.confirme-password;
    var surname=req.body.surname;
    var date=req.body.date;
  //password.match(/[a-z]{8}/gi);
    User.register(
      new User({
        username:username,
        firstName: firstName,
        surname:surname,
        date:date
      }),
      password,
      
      function(err, user) {
        if (err) {
          console.log("/signup user register err", err);
          return res.render("signup");
        } else {
          passport.authenticate("local")(req, res, function() {
            res.redirect("/admin");
          });
        }
      }
    );
  });

app.get("/login", function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/admin");
  } else {
    res.render("login");
  }
});

app.post("/login",passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/login"
  })
);

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get('/offers/:id',function(req,res){
  OfferModel.findOne({id:req.params.id}).populate('user').exec(function(err,offer){
    if(err!==null){
      // console.log("offer find one err", err);
      return;
    } 
    // console.log(offer);
    res.render('products',{
        id:offer.id,
        titre:offer.title,
        image:offer.image,
        description:offer.description,
        city:offer.city,
        prix:offer.price,
        image:offer.images,
        // profile user 
        prenom:offer.user.firstName,
        imageProfil:offer.user.thumbnail,
        descriptionProfil:offer.user.description
    });
  });
});

app.get("/newoffer", function(req, res) {
    res.render("newOffer");
});
app.post('/newoffer', upload.single('image'),function(req,res){
  User.findOne({id:303},function(err,user){
    if(err!==null){
      console.log("offer find one err", err);
      return;
    } 
    // console.log("***",req)
    var newOffer= new OfferModel({
      title:req.body.title,
      id:req.body.id,
      description:req.body.description,
      images:"/uploads/"+req.body.title+".jpg",
      city:req.body.city,
      user:new mongoose.Types.ObjectId(user._id)
    });
    var newImage= "public/uploads/"+req.body.title+".jpg";
    fs.rename(req.file.path, newImage, function(){
      console.log("l'image bien sauvegarde");
    });
    newOffer.save(function(err,offer){
      if (err !== null) {
        console.log('something went wrong err', err);
        
      } else{ 
        // console.log('we just saved the new  offer ',offer);
        res.redirect('/offers/'+offer.id)
      } 
    });
  });
});
  
app.post('/add/favorites/:id',function(req,res){
  var id=req.params.id;
  var favorite=new Favorite({
        idOffer:id,
        isFavorite:true
    });
  favorite.save(function(err, favorite) {
    if (err !== null) {
      console.log('something went wrong err', err);
    } else {
      console.log('we just saved the new favrite offer ',favorite);
    } 
    res.json(favorite);
    });
});

app.post('/remove/favorites/:id',function(req,res){
  var id=req.params.id;
  
  Favorite.UpdateOne({idOffer:id},{isFavorite:false},function(err, favorite) {
    if (err !== null) {
      console.log('something went wrong err', err);
    } else {
      console.log('we just update the favrite offer ',favorite);
    }
  res.json(favorite);
  }); 
});

app.get('/cities/:city',function(req,res){
  var city=req.params.city;
  OfferModel.find({city:city},function(err,offers){
    if(err!==null){
      console.log("offer find one err", err);
      return;
    }
    
    var newoffer= offers.map(function(offer){
      return {
        title: offer.title,
        description: offer.description,
        image: offer.images[0],
        images: offer.images,
        prix:offer.price,
        description:offer.description

      };
    });
    
    res.render('offers',{
    offres:newoffer
    }); 
  }); 
});

app.listen(port,function(){
  console.log('server started',port);
});