require("dotenv").config();
const express = require("express");
const recruiterAuthRoutes = require("./routes/recruiterAuth");
const adminAuthRoutes = require("./routes/adminAuth");
const recruiterDashboardRoutes = require("./routes/recruiterDashboard");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

app.use("/api/admin", adminAuthRoutes);
app.use("/api/recruiter", recruiterAuthRoutes);
app.use("/api/recruiter", recruiterDashboardRoutes);

app.get("/", (req, res) => {
  res.send("Admin backend running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
