// server.js
const express = require('express');
const app = express();
const path = require('path')
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { OTP, User } = require('./models/models');
const crypto = require('crypto');
const { cache } = require('ejs');

// Function to generate a 6-digit OTP
function generateOTP() {
  const otp = crypto.randomInt(100000, 999999).toString(); // Generates a random 6-digit number
  return otp;
}

app.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
    next(); // Continue to the next middleware or route handler
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('view engine', 'ejs');

// Set the directory for EJS templates
app.set('views', path.join(__dirname, 'views'));


mongoose.connect('mongodb://localhost:27017/college-shop');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service (e.g., Gmail, Outlook, etc.)
    auth: {
        user: 'smartcard.xie@gmail.com', // Your email address
        pass: 'tyey mqzr jgdo llyt' // Your email password (consider using environment variables)
    }
});

// Define a route to render the home page
app.get('/', (req, res) => {
    res.render('home') // Send the HTML file
}); 

app.post('/login', async (req, res) => {
    try{
        const user = await User.findOne({email:req.body.email})
        if(user.password == req.body.password){
            res.render('home')
        }
        else if (user.password != req.body.password){
            res.status(400).send('invalid credentials')
        }
        else{
            res.status(404).send('user not found or invalid')
        }
    }
    catch{
        res.status(505).send('server error')
    }
});

app.get('/login', (req, res) => {
    res.render('login') // Send the HTML file
}); 

app.post('/register', async (req, res) => {
    try{
        const otp = generateOTP();
        let instance_otp = new OTP({
            email:req.body.email,
            otp :otp,
        });
        await instance_otp.save();

        const mailOptions = {
            from: 'smartcard.xie@gmail.com', // Sender address
            to: req.body.email, // Recipient address
            subject: 'subject', // Subject line
            text: otp // Plain text body
        };

         // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error sending email.');
        }})
        res.json(req.body)
    }
    catch (error) {
        if (error.code === 11000) { // E11000 is the duplicate key error code
          res.status(400).send('Email already exists');
        } else {
          res.status(500).send('Server error');
        }
      }
});

app.get('/register', (req, res) => {
    res.render('register') // Send the HTML file
});


app.post('/verify-otp', async (req, res) => {
    try {
        uotp = await OTP.findOne({ email: req.body.email })
        if (!uotp) {
            res.status(404).send('invalid otp'); // Empty array means no match
        }
        else if (uotp.otp == req.body.otp){
            await OTP.findByIdAndDelete(uotp.id);
            const user = new User({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password,
                course: req.body.course
            })
            await user.save();
            res.json({ success: true, redirectUrl: '/login' });
        }
        else{
            res.status(404).json({ success: false, redirectUrl: '/' }); // Empty array means no match
        }
    }
    catch (error){
        console.log(error)
        res.status(500).send('Server error');
    }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
