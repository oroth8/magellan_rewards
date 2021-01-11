const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const { check, validationResult } = require("express-validator");
// bring in normalize to give us a proper url, regardless of what user entered
const normalize = require("normalize-url");
const config = require("config");

const Profile = require("../../models/Profile");
const User = require("../../models/Users");

// @route POST api/profile
// @desc Create or Update user profile
// @access Private
router.post(
  "/",
  auth,
  admin,
  check("company", "Company name is required").not().isEmpty(),
  check("bio", "A bio is required").not().isEmpty(),
  check("promo", "A promo is required").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // destructure the request
    const {
      user,
      company,
      website,
      location,
      status,
      category,
      img,
      bio,
      promo,
      social,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram,
      // spread the rest of the fields we don't need to check
      ...rest
    } = req.body;

    // build a profile
    const profileFields = {
      user: req.user.id,
      website:
        website && website !== ""
          ? normalize(website, { forceHttps: true })
          : "",
      company,
      location,
      status,
      category,
      img,
      bio,
      promo,
      // category:
      //   Array.isArray(category) && category !== null
      //     ? category
      //     : category.split(",").map((category) => " " + category.trim()),
      ...rest,
    };

    // Build socialFields object
    const socialFields = { youtube, twitter, instagram, linkedin, facebook };

    // normalize social fields to ensure valid url
    for (const [key, value] of Object.entries(socialFields)) {
      if (value && value.length > 0)
        socialFields[key] = normalize(value, { forceHttps: true });
    }
    // add to profileFields
    profileFields.social = socialFields;

    try {
      // Using upsert option (creates new doc if no match is found):
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
