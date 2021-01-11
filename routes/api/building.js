const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const { check, validationResult } = require("express-validator");

// Bring in user model for database
const Building = require("../../models/Building");

// @route GET api/building
// @desc Get all buildings
// @access Private
router.get("/", auth, admin, async (req, res) => {
  try {
    const buildings = await Building.find().sort({ name: 1 });
    res.json(buildings);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

// @route POST api/building
// @desc Add new building
// @access Private
router.post(
  "/",
  auth,
  admin,
  check("name", "Name is required").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      name,
      address,
      city,
      zipcode,
      neighborhood,
      website,
      ...rest
    } = req.body;
    try {
      const newBuilding = new Building({
        name,
        location: {
          address,
          city,
          zipcode,
          neighborhood,
        },
        website,
      });
      const building = await newBuilding.save();
      res.json(building);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route PUT api/building/:id
// @desc Update building
// @access Private
router.put("/:id", auth, admin, async (req, res) => {
  const { name, address, city, zipcode, neighborhood, website } = req.body;

  //   Building updatedFields object
  const buildingFields = {};
  const locationFields = {};
  if (name) buildingFields.name = name;
  if (address) locationFields.address = address;
  if (city) locationFields.city = city;
  if (zipcode) locationFields.zipcode = zipcode;
  if (neighborhood) locationFields.neighborhood = neighborhood;
  if (website) buildingFields.website = website;

  const updatedFields = {
    name: buildingFields.name,
    website: buildingFields.website,
    location: locationFields,
  };

  try {
    let building = await Building.findById(req.params.id);
    if (!building) return res.status(404).json({ msg: "building not found" });

    building = await Building.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    res.json(building);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route DELETE api/buildings/:id
// @desc DELETE contact
// @access Private
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    let building = await Building.findById(req.params.id);
    if (!building) return res.status(404).json({ msg: "building not found" });
    await Building.findByIdAndRemove(req.params.id);
    res.json({ msg: "building removed." });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
