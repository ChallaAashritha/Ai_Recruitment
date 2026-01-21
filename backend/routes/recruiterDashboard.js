const express = require("express");
const verifyRecruiterToken = require("../middleware/recruiterAuthMiddleware");

const router = express.Router();

/* =========================
   RECRUITER DASHBOARD
========================= */
router.get("/dashboard", verifyRecruiterToken, (req, res) => {
  res.json({
    message: "Welcome Recruiter",
    recruiter: req.recruiter
  });
});

module.exports = router;
