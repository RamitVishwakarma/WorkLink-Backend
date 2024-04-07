const express = require("express");
const router = express.Router();
const { z } = require("zod");
const Worker = require("../../models/Worker");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Gig = require("../../models/gig");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    // stores the data from the request body
    const { name, email, password, skills, location, profilePicture } =
      req.body;
    const existingWorker = await Worker.findOne({ email: email });
    if (existingWorker) {
      return res.status(409).json({ message: "Worker already exists" });
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
      const worker = await Worker.findOne({
        email: email,
      });
      // create token
      const token = jwt.sign(
        { id: worker._id },
        process.env.JWT_SECRET_WORKER,
        {
          expiresIn: "30d",
        }
      );

      // res.header("Authorization", `Bearer ${token}`);
      // res.header("Access-Control-Expose-Headers", "Authorization");
      res.status(201).json({
        token: `Bearer ${token}`,
        message: "Worker SignUp successfull",
        Worker: {
          name: worker.name,
          email: worker.email,
          skills: worker.skills,
          location: worker.location,
          profilePicture: worker.profilePicture,
        },
      });
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
    const { email, password } = req.body;
    const emailschema = z.string().email();
    //Checking for valid data
    if (email === undefined || password === undefined) {
      return res.status(400).json({ message: "Invalid Data provided" });
    }
    //Checking for valid email
    if (!emailschema.safeParse(email).success) {
      return res.status(400).json({ message: "Invalid email" });
    }
    //Checking for valid password and signing in
    const validWorker = await Worker.findOne({ email });

    if (!validWorker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    if (bcrypt.compareSync(password, validWorker.password)) {
      //signin the data with the secret
      console.log(validWorker._id);
      const token = jwt.sign(
        { id: validWorker._id },
        process.env.JWT_SECRET_MANUFACTURER,
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
      return res.status(401).json({ message: "Invalid password" });
    }
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

router.get("/getGigs", async (req, res) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ message: "Unauthorized Worker" });
    }
    const tokenWithoutBearer = token.split(" ")[1];
    jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET_WORKER,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized Worker" });
        } else {
          const worker = await Worker.findOne({ _id: decoded.id });
          if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
          }
          const gigs = await Gig.find({
            $expr: { $lt: [{ $size: "$appliedWorkers" }, "$workerLimit"] },
          });
          const gigsToShow = gigs.filter((gig) => {
            return !gig.appliedWorkers.includes(worker._id);
          });
          res.status(200).json({ gigsToShow });
        }
      }
    );
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

router.get("/getProfile", async (req, res) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ message: "Unauthorized Worker" });
    }
    const tokenWithoutBearer = token.split(" ")[1];
    jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET_WORKER,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized Worker" });
        } else {
          const worker = await Worker.findOne({ _id: decoded.id });
          if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
          }
          res.status(200).json({
            worker: {
              name: worker.name,
              email: worker.email,
              skills: worker.skills,
              location: worker.location,
              profilePicture: worker.profilePicture,
            },
          });
        }
      }
    );
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

router.post("/editProfile", async (req, res) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ message: "Unauthorized Worker" });
    }
    const tokenWithoutBearer = token.split(" ")[1];
    jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET_WORKER,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized Worker" });
        } else {
          const worker = await Worker.findOne({ _id: decoded.id });
          if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
          }
          const { name, email, skills, location, profilePicture } = req.body;
          if (name) {
            worker.name = name;
          }
          if (email) {
            worker.email = email;
          }
          if (skills) {
            worker.skills = skills;
          }
          if (location) {
            worker.location = location;
          }
          if (profilePicture) {
            worker.profilePicture = profilePicture;
          }
          await worker.save();
          res.status(200).json({
            worker: {
              name: worker.name,
              email: worker.email,
              skills: worker.skills,
              location: worker.location,
              profilePicture: worker.profilePicture,
            },
          });
        }
      }
    );
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

router.post("/applyToGig", async (req, res) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ message: "Unauthorized Worker" });
    }
    const tokenWithoutBearer = token.split(" ")[1];
    jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET_WORKER,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized Worker" });
        } else {
          const worker = await Worker.findOne({ _id: decoded.id });
          if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
          }
          const { gigId } = req.body;
          const gig = await Gig.findOne({ _id: gigId });
          if (!gig) {
            return res.status(404).json({ message: "Gig not found" });
          }
          if (gig.appliedWorkers.includes(worker._id)) {
            return res.status(409).json({ message: "Worker already applied" });
          }
          if (gig.appliedWorkers.length >= gig.workerLimit) {
            return res.status(409).json({ message: "Worker limit reached" });
          }
          gig.appliedWorkers.push(worker._id);
          await gig.save();
          res.status(200).json({ message: "Applied to gig" });
        }
      }
    );
  } catch {
    res.status(500).json({ message: "Something went down with server" });
  }
});

module.exports = router;
