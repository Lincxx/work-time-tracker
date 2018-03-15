const express = require('express');
const exphbs = require('express-handlebars');
const path =  require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const moment = require('moment');

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
mongoose.connect('mongodb://localhost/time-tracker', {
    //useMongoClient:true
})
.then(()=> console.log('MongoDB Connected'))
.catch( err => console.log(err));


//Require the modle
require('./models/AcquireTime')
const AcquireTime = mongoose.model('acquireTime');

// Routes
app.get('/', (req, res)=>{
    let today = moment().format('LL');;
    console.log(today)
    res.render('home', {today: today});
});

app.post('/addTime', (req, res) => {
    console.log(req.body)
    const newAcquireTime = ({
        date: req.body.date,
        minutes: req.body.minutes
    });

    new AcquireTime(newAcquireTime).save()
        .then(item =>{
            res.send('Time added');
        })
});

//Show all 
app.get('/showDates', (req, res)=>{
    AcquireTime.find()
        .then(items => {
            res.render('show',{items:items});
        })
    
})



const port = 3000;
app.listen(port, ()=>{
    console.log(`Server up and running on port ${port}`);
});