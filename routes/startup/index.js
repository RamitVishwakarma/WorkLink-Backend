const express = require("express");
const router = express.Router();
const { z } = require("zod");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const StartUp = require("../../models/startup");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    // stores the data from the request body
    const {
      companyName,
      companyEmail,
      password,
      workSector,
      location,
      profilePicture,
    } = req.body;

    const existingWorker = await Worker.findOne({ companyEmail: companyEmail });
    if (existingWorker) {
      return res.status(409).send("startup already exists");
    }
    //creates a schema to validate
    const startupSchema = z.object({
      companyName: z.string().min(1),
      companyEmail: z.string().email(),
      password: z.string().min(6),
      workSector: z.string().min(1),
      location: z.object({
        city: z.string().min(1),
        state: z.string().min(1),
      }),
    });
    // validate the data
    const validatedData = startupSchema.safeParse({
      companyName,
      companyEmail,
      password,
      workSector,
      location,
    });
    // check if the data is valid
    if (validatedData.success) {
      //Save data to db hash pwd
      const hashedpassword = bcrypt.hashSync(password, 10);
      const newStartup = new StartUp({
        companyName,
        companyEmail,
        password: hashedpassword,
        workSector,
        location,
        profilePicture,
      });
      await newStartup.save();
      res.status(201).send("Startup SignUp successfull");
    } else {
      res.status(400).send("Error validating data");
    }
  } catch {
    res.status(500).send("Something went down with server");
  }
});

// Signin route
router.post("/signin", (req, res) => {
  // Implement your signin logic here
  try {
    const { companyEmail, password } = req.body;
    const emailschema = z.string().email();
    //Checking for valid data
    const emailValidation = emailschema.safeParse(companyEmail);
    if (!emailValidation.success) {
      return res.status(400).send("Invalid email");
    }
    //Checking for valid email
    if (companyEmail === undefined || password === undefined) {
      return res.status(400).send("Invalid Data provided");
    }
    //Checking for valid password
    const validStartup = StartUp.findOne({ companyEmail: companyEmail });
    if (!validStartup) {
      return res.status(404).send("Startup not found");
    }
    //Checking for valid password and signing in
    if (bcrypt.compareSync(password, validStartup.password)) {
      const token = jwt.sign(
        { id: validStartup._id },
        process.env.JWT_SECRET_STARTUP,
        {
          expiresIn: "30d",
        }
      );
      res.header("Authorization", `Bearer ${token}`);
      res.header("Access-Control-Expose-Headers", "Authorization");
      res.status(200).json({
        StartUp: {
          companyName: validStartup.companyName,
          companyEmail: validStartup.companyEmail,
          workSector: validStartup.workSector,
          location: validStartup.location,
          profilePicture: validStartup.profilePicture,
        },
      });
    } else {
      res.status(401).send("Invalid password");
    }
  } catch {
    res.status(500).send("Something went down with server");
  }
});

module.exports = router;
