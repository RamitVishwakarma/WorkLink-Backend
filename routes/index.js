const express = require("express");
const router = express.Router();

// adding routes to files
router.get("/", (req, res) => {
  res.send("Welcome to WorkLink");
  console.log("Welcome to WorkLink");
});

router.post("/api/signup", (req, res) => {
  const { email, password, role } = req.body;
  console.log(email, password, role);
  res.send("Signup");
  console.log("Signup");
});
// const workerRoute = require("./worker/index.js");
// const startupRoute = require("./startup/index.js");
// const manufacturerRoute = require("./manufacturer/index.js");

// router.use("/api/login", LoginRoute);
// router.use("/api/worker", workerRoute);
// router.use("/api/startup", startupRoute);
// router.use("/api/manufacturer", manufacturerRoute);

module.exports = router;
