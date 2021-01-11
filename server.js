const express = require("express");
const connectDB = require("./config/db");

// Init express
const app = express();
// Init DB
connectDB();
// Init Middleware
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API Running"));

// Define routes
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/building", require("./routes/api/building"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/card", require("./routes/api/card"));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
