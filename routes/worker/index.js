const express = require("express");
const router = express.Router();
const { z } = require("zod");
const Worker = require("../../models/Worker");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    // stores the data from the request body
    const { name, email, password, skills, location, profilePicture } =
      req.body;

    const existingWorker = await Worker.findOne({ email: email });
    if (existingWorker) {
      return res.status(409).send("Worker already exists");
    }
    //creates a schema to validate
    const workerSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      skills: z.array(z.string()),
      location: z.object({
        city: z.string().min(1),
        state: z.string().min(1),
      }),
    });
    // validate the data
    const validatedData = workerSchema.safeParse({
      name,
      email,
      password,
      skills,
      location,
    });
    // check if the data is valid
    if (validatedData.success) {
      //Save data to db hash pwd
      const hashedpassword = bcrypt.hashSync(password, 10);
      const newWorker = new Worker({
        name,
        email,
        password: hashedpassword,
        skills,
        location,
        profilePicture,
      });
      await newWorker.save();
      res.status(201).send("SignUp successfull");
    } else {
      res.status(400).send("Error validating data");
    }
  } catch {
    res.status(500).send("Something went down with server");
  }
});

// Signin route
router.post("/signin", async (req, res) => {
  // Implement your signin logic here
  try {
    const { email, password } = req.body;
    const emailschema = z.string().email();
    //Checking for valid data
    if (email === undefined || password === undefined) {
      return res.status(400).send("Invalid Data provided");
    }
    //Checking for valid email
    if (!emailschema.safeParse(email).success) {
      return res.status(400).send("Invalid email");
    }
    //Checking for valid password and signing in
    const validWorker = await Worker.findOne({ email });

    if (!validWorker) {
      return res.status(404).send("Worker not found");
    }
    if (bcrypt.compareSync(password, validWorker.password)) {
      //signin the data with the secret
      console.log(validWorker._id);
      const token = jwt.sign(
        { id: validWorker._id },
        process.env.JWT_SECRET_WORKER,
        {
          expiresIn: "30d",
        }
      );
      //send the token to the user
      res.header("Authorization", `Bearer ${token}`);
      res.header("Access-Control-Expose-Headers", "Authorization");
      res.status(200).json({
        worker: {
          name: validWorker.name,
          email: validWorker.email,
          skills: validWorker.skills,
          location: validWorker.location,
          profilePicture: validWorker.profilePicture,
        },
      });
    } else {
      return res.status(401).send("Invalid password");
    }
  } catch {
    res.status(500).send("Something went down with server");
  }
});

module.exports = router;
