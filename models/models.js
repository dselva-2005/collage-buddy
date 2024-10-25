const mongoose = require('mongoose');

// OTP Schema
const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensures that email is unique
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // OTP expires after 5 minutes (300 seconds)
    }
});

// User Schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true // Removes whitespace from both ends
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures that email is unique
        lowercase: true, // Converts the email to lowercase
        match: [/.+@.+\..+/, 'Please enter a valid email address'] // Regex for email validation
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // Minimum length for the password
    },
    course: {
        type: String,
        required: true,
        enum: [
            'Computer Science',
            'Mechanical Engineering',
            'Civil Engineering',
            'Electrical Engineering',
            'Business Administration'
        ] // Allows only these values
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,  // You can store the image URL or path here
        required: true,
    },
    ratings: {
        type: Number,
        required: true,
        min: 0,
        max: 5, // Assuming the rating is out of 5
    },
    price: {
        type: Number,
        required: true,
    }
});

// Review Schema
const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', // Reference to the User model
        required: true
    },
    reviewText: {
        type: String,
        required: true,
        trim: true // Removes whitespace from both ends
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5 // Rating should be out of 5
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes
productSchema.index({ name: 'text' });

// Define the testimony schema
const testimonySchema = new mongoose.Schema({
  userName: {
      type: String,
      required: true,
      trim: true // Removes whitespace from both ends
  },
  review: {
      type: String,
      required: true,
      minlength: 10, // Minimum length for the review
      maxlength: 500 // Maximum length for the review
  },
  createdAt: {
      type: Date,
      default: Date.now // Automatically set to current date
  }
});

const orderSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true
    },
    items: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product', // Reference to the Product model
          required: true
        },
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'], // Order status can be one of these
      default: 'Pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Create and export the model
  // Create a model for testimonies
  
  // Models
  const Order = mongoose.model('Order', orderSchema);
const Testimony = mongoose.model('Testimony', testimonySchema);
const Product = mongoose.model('Product', productSchema);
const OTP = mongoose.model('OTP', otpSchema);
const User = mongoose.model('user', userSchema);
const Review = mongoose.model('Review', reviewSchema); // New Review model

module.exports = {
    User,
    OTP,
    Product,
    Review,
    Testimony,
    Order
};
