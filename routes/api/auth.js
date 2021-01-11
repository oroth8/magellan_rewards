const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const auth = require("../../middleware/auth");
const User = require("../../models/Users");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");

const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: config.get("sendgridKey"),
  })
);

// @route GET api/auth
// @desc test route to get token
// @access Public
router.get("/", auth, async (req, res) => {
  try {
    //   specify how you want to find a user in the DB and what you want from the db. Everything but password here
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error (auth)");
  }
});

// @route POST api/auth
// @desc Authenticate User and get Token (login)
// @access Public
router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
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

    const { email, password } = req.body;

    try {
      // See if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
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

// @route POST api/auth/reset
// @desc Send user a reset link for password based on email
// @access public
router.post("/reset", (req, res) => {
  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      console.log(error);
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email }).then((user) => {
      if (!user) {
        return res
          .status(422)
          .json({ error: "Cannot find account associated with this email" });
      }
      user.resetToken = token;
      user.expireToken = Date.now() + 3600000;
      user.save().then((result) => {
        transport.sendMail({
          to: user.email,
          from: "oroth8@comcast.net",
          subject: "Password Reset NO-REPLY",
          html: `
                    <p>You have requested a password reset for Magellan Rewards:</P>
                    <h5>Click this link to reset your password: <a href="http://localhost:8080/reset/${token}">Password Reset</a></h5>
                    `,
        });
        res.json({ message: "check email" });
      });
    });
  });
});

router.post("/new-password", async (req, res) => {
  const newPassword = req.body.password;
  const sentToken = req.body.token;
  try {
    const salt = await bcrypt.genSalt(10);
    let user = await User.findOne({
      resetToken: sentToken,
      expireToken: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(422)
        .json({ error: "Try Again Session Has Expired..." });
    }
    const hashpassword = await bcrypt.hash(newPassword, salt);
    user.password = hashpassword;
    user.resetToken = undefined;
    user.expireToken = undefined;
    await user.save();
    res.json({ message: "password reset success" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error (user)");
  }
});

module.exports = router;
