/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const connectDb = require("./config/db");

// Create Express app
const app = express();

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDb();

// Middleware
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.json());
app.use(
  cors({
    origin: ["*"], // Allow requests from all origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Specify the allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify the allowed headers
  })
);
app.use(morgan("dev"));
  //routes
  app.use('/api/user', require('./routes/userRoutes'))
  app.use('/api/admin', require('./routes/adminRoutes'));


app.get("*", (req, res) => {
    res.send("Hello I'm backend")
  })


  // Set the port
  const PORT = process.env.PORT || 5001;
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`.white.bgMagenta);
  });

