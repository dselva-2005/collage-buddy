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
const { OTP, User, Product, Review, Testimony, Order } = require('./models/models');
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
// Home route (protected route)
app.get('/', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find();
    const testimonies = await Testimony.find(); // Fetch all testimonies

    res.render('home', { 
      user: req.session.user, 
      products: products, 
      testimonies: testimonies // Pass testimonies to the template
    }); 
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

app.get('/products/all', async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products from the database
    res.render('allProducts', { user: req.session.user, products });  // Pass products to EJS view
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Endpoint to get product details with reviews
app.get('/products/:id', async (req, res) => {
  try {
      const productId = req.params.id;

      // Find the product by ID
      const product = await Product.findById(productId);
      
      // If the product doesn't exist, return a 404 error
      if (!product) {
          return res.status(404).send('Product not found');
      }

      // Fetch the reviews for the product
      const reviews = await Review.find({ productId }).populate('userId', 'firstName lastName'); // Populate user details
      
      // Render the product detail page with the product and its reviews
      res.render('productDetail', {
          user: req.session.user, 
          product,
          reviews,
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

app.post('/products/:id/reviews', async (req, res) => {
  try {
      const productId = req.params.id;
      const { reviewText, rating } = req.body;

      // Assuming you have a logged-in user
      const userId = req.session.user._id;

      // Create a new review
      const review = new Review({
          productId,
          userId,
          reviewText,
          rating
      });

      // Save the review
      await review.save();

      // Redirect back to the product detail page
      res.redirect(`/products/${productId}`);
  } catch (error) {
      console.error('Error saving review:', error);
      res.status(500).send('Server Error');
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
  console.log(`Server running at http://localhost:${PORT}/`);
});



// Search endpoint
app.get('/products/search', async (req, res) => {
  const query = req.query.query;

  try {
      // Full text search using Mongoose
      const products = await Product.find({
          $text: { $search: query }
      });

      res.render('search', { products:products });
  } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).send('Server error');
  }
});


app.get('/testimonies', (req, res) => {
  res.render('testimony', { user: req.session.user, message: null });
});

// Route to handle testimony submission
app.post('/testimonies', async (req, res) => {
  const { userName, review } = req.body;
  
  // Create a new testimony
  const newTestimony = new Testimony({
      userName,
      review,
      createdAt: new Date()
  });

  try {
      await newTestimony.save(); // Save to database
      res.redirect('/')
  } catch (error) {
      console.error('Error saving testimony:', error);
      res.render('testimony', { message: 'There was an error submitting your testimony. Please try again.' });
  }
});


app.post('/checkout',async (req,res)=>{
userId = req.session.user._id
cartItems = req.body
const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0); // Calculate total
console.log(totalAmount)
// Create a new order
let order = new Order({
  userId,
  items: cartItems,
  totalAmount,
  status: 'Pending'
});
// // Save the order to the database
  dborder = await order.save()
  res.send({orderId:dborder._id, success:true})
});


app.get('/order/:id', async (req, res) => {
  try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId); // Populate userId if you need user info

      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

      res.render('bill', { order }); // Render bill view with order data
  } catch (err) {
      console.error('Error fetching order:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get all orders of a user in reverse order and render the EJS view
app.get('/users/:userId/orders', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find all orders by userId, sort by createdAt in descending order
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 }) // Sort orders by creation date in reverse order
      .populate('items.id') // Populate product details
      .exec();

    if (!orders.length) {
      return res.render('orders', { orders: [], message: 'No orders found for this user.' });
    }

    // Render the EJS view and pass the orders data
    res.render('orders', { orders, message: null, user:req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).render('orders', { orders: [], message: 'Server error. Could not fetch orders.' });
  }
});
