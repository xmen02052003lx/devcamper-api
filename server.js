const path = require("path")
const express = require("express")
const dotenv = require("dotenv")
const morgan = require("morgan")
const colors = require("colors")
const fileupload = require("express-fileupload")
const cookieParser = require("cookie-parser")
const mongoSanitize = require("express-mongo-sanitize")
const helmet = require("helmet")
const xss = require("xss-clean") // This package is deprecated!
const rateLimit = require("express-rate-limit")
const hpp = require("hpp")
const cors = require("cors")
const errorHandler = require("./middleware/error")
const connectDB = require("./config/db")

// Route files
const bootcamps = require("./routes/bootcamps")
const courses = require("./routes/courses")
const auth = require("./routes/auth")
const users = require("./routes/users")
const reviews = require("./routes/reviews")

// Load env vars
dotenv.config({ path: "./config/config.env" })

// Connect to database
connectDB()

const app = express()

// Body parser
app.use(express.json())

// Cookie parser
app.use(cookieParser())

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// File uploading
app.use(fileupload())

// Sanitize data (prevent NOSQL injection - this will get rid of all the "$" sign in the input, so you can't do like: {"email": {"$gt": ""}, "password": 123456})
app.use(mongoSanitize())

// Set security headers (just add a little bit more security, you can read what header does it set in the docs if you want)
app.use(helmet({ contentSecurityPolicy: false }))

//Prevent XSS attacks (<script> tag will become &lt;script>, so no script will be store in our db)
// This package is deprecated!
app.use(xss())

// Rate limiting per IP
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100 // max request per windowMs
})
app.use(limiter)

// Prevent http param pollution (hpp)
app.use(hpp())

// Enable CORS
app.use(cors())

// Set static folder
app.use(express.static(path.join(__dirname, "public")))

// Mount routers
app.use("/api/v1/bootcamps", bootcamps)
app.use("/api/v1/courses", courses)
app.use("/api/v1/auth", auth)
app.use("/api/v1/users", users)
app.use("/api/v1/reviews", reviews)
// errorHandler middleware have to be after the route
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
)

// Handle unhandled promise rejection
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red)
  // Close server & exit process
  server.close(() => process.exit(1))
})
