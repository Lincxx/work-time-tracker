const express        = require('express');
const exphbs         = require('express-handlebars');
const path           =  require('path');
const bodyParser     = require('body-parser');
const mongoose       = require('mongoose');
const moment         = require('moment');
const bcrypt         = require('bcryptjs');
const flash          = require('connect-flash');
const session        = require('express-session');
const passport       = require('passport')


require('dotenv').config();

// Create app
const app = express();

//Setup engine
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder middleware
app.use(express.static(path.join(__dirname, 'public')));

// Map global promise = get rid of waring
mongoose.Promise = global.Promise;


//Connect to Mongoose
mongoose.connect(process.env.mongoUIR, {
    //useMongoClient:true
})
.then(()=> console.log('MongoDB Connected'))
.catch( err => console.log(err));


//Require the  A cquireTime Model
require('./models/AcquireTime')
const AcquireTime = mongoose.model('acquireTime');

// Load User Model
require('./models/Users');
const User = mongoose.model('users');


// Passport Config
require('./config/passport')(passport);


// Load helper
const {ensureAuthenticated} = require('./helpers/auth')

// Express Session Middleware
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

// Passport  Middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

//Global Variable Middleware
app.use(function(req, res, next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});


// Routes
app.get('/', (req, res)=>{
    let today = moment().format('LL');
    res.render('home', {today: today});
});

app.post('/addTime', ensureAuthenticated, (req, res) => {
    const day = moment().format('dddd');
    const newClass = day == 'Monday' ? 'table-info' : ''
    const newAcquireTime = ({
        date: req.body.date,
        minutes: req.body.minutes,
        day: day,
        class: newClass,
        user: req.user.id
    });

    //res.send("there");
    new AcquireTime(newAcquireTime).save()
        .then(item =>{
            res.redirect('/showDates');
        })
});

//Show all 
app.get('/showDates', ensureAuthenticated, (req, res)=>{
    AcquireTime.find({user: req.user.id})
        .then(items => {
            //console.log(items)
            res.render('show',{items:items});
        })
    
})


// USERS
// User Register Route
app.get('/users/registration', (req, res)=>{
    res.render('users/register');
});

// User Form Post
app.post('/users/register', (req, res)=>{
    //console.log(req.body)
    let errors = [];
    if(req.body.password !== req.body.password2){
        errors.push({
            text: 'Password do not match'
        });
    }

    if(req.body.name == "" || req.body.email == ""){
        errors.push({
            text: 'Name or Email can not be blank'
        });
    }

    if (errors.length > 0) {
        res.render('users/register', {
            errors: errors,
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            password2: req.body.password2,
        })
    } else {
        // Check for duplicate email 
        User.findOne({email: req.body.email})
            .then(user => {
                if(user){
                    req.flash('error_msg', 'Email is already taked');
                    res.redirect('.users/register')
                } else {
                    var newUser = new User({
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password
                    })

                    //encrypt password
                    bcrypt.genSalt(10, (err, salt) =>{
                        bcrypt.hash(newUser.password, salt, (err, hash)=>{
                            if(err) throw err;
                            //Change the password to the hash
                            newUser.password = hash
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can log in')
                                    res.redirect('/users/login')
                                })
                                .catch(err => {
                                    console.log(err);
                                    return;
                                })
                        })
                    })
                }
            })
    }

});


app.get('/users/login', (req, res)=>{
    //console.log(req.user)
    res.render('users/login');
})

// Login Form Post
app.post('/users/login', (req, res, next) =>{
    passport.authenticate('local', {
        successRedirect:'/',
        failureRedirect: '/users/login',
        failureFlash:true
    })(req, res, next);
});

// Logout user
app.get('/logout', (req, res) =>{
    req.logout();
    req.flash('success_msg', 'You are logged out')
    res.redirect('/')
});


const port = 3000;
app.listen(port, ()=>{
    console.log(`Server up and running on port ${port}`);
});