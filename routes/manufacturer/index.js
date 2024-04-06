const express = require("express");
const router = express.Router();
const { z } = require("zod");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Manufacturer = require("../../models/manufacturer");
const Gig = require("../../models/gig");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    // stores the data from the request body
    const {
      companyName,
      companyEmail,
      password,
      workSector,
      machines,
      location,
      profilePicture,
    } = req.body;

    const existingManufacturer = await Manufacturer.findOne({
      companyEmail: companyEmail,
    });
    if (existingManufacturer) {
      return res.status(409).json({ message: "Manufacturer already exists" });
    }
    //creates a schema to validate
    const manufacturerSchema = z.object({
      companyName: z.string().min(1),
      companyEmail: z.string().email(),
      password: z.string().min(6),
      workSector: z.string().min(1),
      machines: z.array(
        z.object({
          name: z.string().min(1),
          isAvailable: z.boolean().default(true),
        })
      ),
      location: z.object({
        city: z.string().min(1),
        state: z.string().min(1),
      }),
    });
    // validate the data
    const validatedData = manufacturerSchema.safeParse({
      companyName,
      companyEmail,
      password,
      workSector,
      machines,
      location,
    });
    // check if the data is valid
    if (validatedData.success) {
      //Save data to db hash pwd
      const hashedpassword = bcrypt.hashSync(password, 10);
      const newManufacturer = new Manufacturer({
        companyName,
        companyEmail,
        password: hashedpassword,
        workSector,
        machines,
        location,
        profilePicture,
      });
      await newManufacturer.save();
      const manufacturer = await Manufacturer.findOne({
        companyEmail: companyEmail,
      });
      // create token
      const token = jwt.sign(
        { id: manufacturer._id },
        process.env.JWT_SECRET_MANUFACTURER,
        {
          expiresIn: "30d",
        }
      );
      // res.header("Authorization", `Bearer ${token}`);
      // res.header("Access-Control-Expose-Headers", "Authorization");
      res.status(201).json({
        token: `Bearer ${token}`,
        message: "Manufacturer SignUp successfull",
      });
      res.status(201).json({ message: "Manufacturer SignUp successfull" });
    } else {
      res.status(400).json({ message: "Error validating data" });
    }
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

// Signin route
router.post("/signin", async (req, res) => {
  // Implement your signin logic here
  try {
    const { companyEmail, password } = req.body;
    const emailschema = z.string().email();
    //Checking for valid data
    const emailValidation = emailschema.safeParse(companyEmail);
    if (!emailValidation.success) {
      return res.status(400).json({ message: "Invalid email" });
    }
    //Checking for valid email
    if (companyEmail === undefined || password === undefined) {
      return res.status(400).json({ message: "Invalid Data provided" });
    }
    //Checking for valid password
    const validManufacturer = await Manufacturer.findOne({
      companyEmail: companyEmail,
    });
    if (!validManufacturer) {
      return res.status(404).json({ message: "Manufacturer not found" });
    }
    //Checking for valid password and signing in
    if (bcrypt.compareSync(password, validManufacturer.password)) {
      const token = jwt.sign(
        { id: validManufacturer._id },
        process.env.JWT_SECRET_Manufacturer,
        {
          expiresIn: "30d",
        }
      );
      res.header("Authorization", `Bearer ${token}`);
      res.header("Access-Control-Expose-Headers", "Authorization");
      res.status(200).json({
        Manufacturer: {
          companyName: validManufacturer.companyName,
          companyEmail: validManufacturer.companyEmail,
          workSector: validManufacturer.workSector,
          location: validManufacturer.location,
          machines: validManufacturer.machines,
          profilePicture: validManufacturer.profilePicture,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

router.post("/createGig", async (req, res) => {
  try {
    const { location, skillsRequired, pay, description } = req.body;

    const token = req.header("Authorization");

    const tokenWithoutBearer = token.split(" ")[1];

    const gigSchema = z.object({
      location: z.object({
        city: z.string().min(1),
        state: z.string().min(1),
      }),
      skillsRequired: z.array(z.string().min(1)),
      pay: z.number().int(),
      description: z.string().min(1),
    });

    jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET_MANUFACTURER,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Invalid token" });
        } else {
          const manufacturer = await Manufacturer.findOne({ _id: decoded.id });
          if (!manufacturer) {
            return res.status(404).json({ message: "Manufacturer not found" });
          } else {
            // validating the data
            const validatedData = gigSchema.safeParse({
              companyName: manufacturer.companyName,
              location,
              skillsRequired,
              pay,
              description,
            });
            if (validatedData.success) {
              const newGig = new Gig({
                companyName: manufacturer.companyName,
                location,
                skillsRequired,
                pay,
                description,
              });
              await newGig.save();
              const getGigId = await Gig.findOne({
                companyName: manufacturer.companyName,
              });
              await Manufacturer.findOneAndUpdate(
                { companyEmail: manufacturer.companyEmail },
                { $push: { gigs: getGigId._id } }
              );
              res.status(201).json({ message: "Gig created" });
            } else {
              res.status(400).json({ message: "Error validating data" });
            }
          }
        }
      }
    );
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

router.delete("/deleteGig", async (req, res) => {
  try {
    const { id } = req.body;
    const token = req.header("Authorization");
    const tokenWithoutBearer = token.split(" ")[1];

    jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET_MANUFACTURER,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Invalid token" });
        } else {
          const manufacturer = await Manufacturer.findOne({ _id: decoded.id });
          if (!manufacturer) {
            return res.status(404).json({ message: "Manufacturer not found" });
          } else {
            const gig = await Gig.findOne({ _id: id });
            if (!gig) {
              return res.status(404).json({ message: "Gig not found" });
            } else {
              await Gig.deleteOne({ _id: id });
              await Manufacturer.findOneAndUpdate(
                { companyEmail: manufacturer.companyEmail },
                { $pull: { gigs: id } }
              );
              res.status(200).json({ message: "Gig deleted" });
            }
          }
        }
      }
    );
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

router.get("/yourGigs", async (req, res) => {
  try {
    const token = req.header("Authorization");
    const tokenWithoutBearer = token.split(" ")[1];

    jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET_MANUFACTURER,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Invalid token" });
        } else {
          const manufacturer = await Manufacturer.findOne({ _id: decoded.id });
          if (!manufacturer) {
            return res.status(404).json({ message: "Manufacturer not found" });
          } else {
            const gigs = await Gig.find({
              companyName: manufacturer.companyName,
            });
            res.status(200).json({ gigs });
          }
        }
      }
    );
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

module.exports = router;
