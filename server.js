// server.js
const express = require('express');
const fs = require('fs'); // Import fs module
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { OTP, User, Product } = require('./models/models');
const multer = require('multer');

// Function to generate a 6-digit OTP
function generateOTP() {
  const otp = crypto.randomInt(100000, 999999).toString(); // Generates a random 6-digit number
  return otp;
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Directory to store images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Rename the file to avoid conflicts
  }
});

// Upload middleware
const upload = multer({ storage: storage });


// Serve the uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

// Set up express-session middleware for session handling
app.use(session({
  secret: 'your_secret_key', // Use a strong secret key
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/college-shop' }), // Store sessions in MongoDB
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day expiration
}));

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // Proceed to the next middleware/route handler
  }
  res.redirect('/login'); // Redirect to login if not authenticated
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect('mongodb://localhost:27017/college-shop');

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'smartcard.xie@gmail.com', // Your email address
    pass: 'tyey mqzr jgdo llyt' // Your email password (consider using environment variables)
  }
});

// Home route (protected route)
app.get('/', async (req, res) => {
    try {
      const products = await Product.find();
      res.render('home', { user: req.session.user, products:products }); // Render products.ejs and pass products to it
  } catch (error) {
      res.status(500).send('Server Error');
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && user.password == req.body.password) {
      req.session.user = user; // Set the session user object
      res.redirect('/');
    } else {
      res.status(400).send('Invalid credentials');
    }
  } catch {
    res.status(505).send('Server error');
  }
});

app.get('/login', (req, res) => {
  res.render('login'); // Send the login HTML file
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/'); // Redirect to login page after logging out
  });
});


// Register route with OTP
app.post('/register', async (req, res) => {
  try {
    const otp = generateOTP();
    let instance_otp = new OTP({
      email: req.body.email,
      otp: otp,
    });
    await instance_otp.save();

    const mailOptions = {
      from: 'smartcard.xie@gmail.com',
      to: req.body.email,
      subject: 'subject',
      text: otp,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Error sending email.');
      }
    });

    res.json(req.body);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send('Email already exists');
    } else {
      res.status(500).send('Server error');
    }
  }
});

app.get('/register', (req, res) => {
  res.render('register'); // Send the register HTML file
});

// Verify OTP and complete registration
app.post('/verify-otp', async (req, res) => {
  try {
    const uotp = await OTP.findOne({ email: req.body.email });
    if (!uotp) {
      res.status(404).send('Invalid OTP');
    } else if (uotp.otp == req.body.otp) {
      await OTP.findByIdAndDelete(uotp.id);
      const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        course: req.body.course
      });
      await user.save();
      res.json({ success: true, redirectUrl: '/login' });
    } else {
      res.status(404).json({ success: false, redirectUrl: '/' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(); // Destroy session
  res.redirect('/login');
});

app.get('/products/add', (req, res) => {
  res.render('addProduct');
});


app.post('/products/add', upload.single('image'), async (req, res) => {
  try {
    const { name, ratings, price } = req.body;
    const imagePath = req.file.path;  // Path to the uploaded image

    // Create a new product object
    const product = new Product({
      name: name,
      image: imagePath,  // Store image path
      ratings: ratings,
      price:price,
    });

    // Save the product to MongoDB
    await product.save();

    res.redirect('/products')
  } catch {
    res.status(500).json({ message: 'Error creating product' });
  }
});

app.get('/products', async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find();

    // Render the EJS view and pass the products data
    res.render('products', { products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
});


// GET endpoint to remove a product (using query parameters)
app.get('/products/delete/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    // Find the product by ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Delete the product image from the uploads folder
    const imagePath = path.join(__dirname, product.image);
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.log("Image file couldn't be deleted:", err);
      }
    });

    // Delete the product from the database
    await Product.findByIdAndDelete(productId);

    res.redirect('/products')
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
});


// GET all users
app.get('/users', async (req, res) => {
  try {
      const users = await User.find();
      res.render('users', { users }); // Render the users template with the fetched users
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

app.get('/users/add', (req, res) => {
  res.render('add-user'); // Render the add-user template
});

// POST - Add a New User
app.post('/users/add', async (req, res) => {
  try {
      const { firstName, lastName, email, password, course } = req.body;

      // Create a new user instance
      const newUser = new User({ firstName, lastName, email, password, course });

      // Save the user to the database
      await newUser.save();

      // Redirect to the user list or another page after successful addition
      res.redirect('/users'); // Change the redirect as needed
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

// DELETE - Remove a User by ID
app.get('/users/delete/:id', async (req, res) => {
  try {
      const userId = req.params.id;

      // Delete the user from the database
      await User.findByIdAndDelete(userId);

      // Redirect to the user list after deletion
      res.redirect('/users');
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
