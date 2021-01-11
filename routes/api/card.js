const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/Users");
const Card = require("../../models/Card");
const checkObjectId = require("../../middleware/checkObjectId");

// @route    POST api/card
// @desc     Create a card
// @access   Private
router.post(
  "/",
  [auth, [check("name", "name is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newCard = new Card({
        name: req.body.name,
        user: req.user.id,
      });

      const card = await newCard.save();

      res.json(card);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    GET api/card/:id
// @desc     Get card by ID
// @access   Private
router.get("/:id", [auth, checkObjectId("id")], async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }

    res.json(card);
  } catch (err) {
    console.error(err.message);

    res.status(500).send("Server Error");
  }
});

module.exports = router;
