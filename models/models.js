const mongoose = require('mongoose')

const OtpSchema = new mongoose.Schema({

});
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
  

const OTP = mongoose.model('OTP', otpSchema);
const User = mongoose.model('user', userSchema);
module.exports = {
    User,
    OTP,
  };