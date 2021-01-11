const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const config = require("config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Bring in user model for database
const User = require("../../models/Users");

// @route GET api/users
// @desc Get all users
// @access Private
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).send("server error");
  }
});

// @route POST api/users
// @desc Register user
// @access Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("building", "Building is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  //   need to add async to make async await
  async (req, res) => {
    //   if error from validation, store in errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If errors array is not empty then send status of what is in errors array
      return res.status(400).json({ errors: errors.array() });
    }
    // Grab whatever data from post with req.body
    //  console.log(req.body);
    // destruction req.body so we dont have to retype

    const {
      name,
      email,
      password,
      isAdmin,
      building,
      resetToken,
      expireToken,
    } = req.body;

    try {
      // See if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }
      user = new User({
        name,
        email,
        password,
        isAdmin,
        building,
        resetToken,
        expireToken,
      });
      // Encrypt the password
      //   create password salt
      const salt = await bcrypt.genSalt(10);
      // bcrypt takes in two things, password and salt
      user.password = await bcrypt.hash(password, salt);
      //   save user
      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          //  grab mongodb id
          id: user._id,
        },
      };
      //   Grabs payload and jwtToken from config

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        //   expiresIn: sets token expiration time in seconds
        { expiresIn: 3600 },
        (error, token) => {
          if (error) throw error;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error (user)");
    }
  }
);

module.exports = router;
