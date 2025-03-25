const jwt = require("jsonwebtoken")
const asyncHandler = require("./async")
const ErrorResponse = require("../util/errorResponse")
const User = require("../models/User")

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // we assign the token in the Bearer token in header to "token" variable
    // it's up to you to use the header or not
    token = req.headers.authorization.split(" ")[1]
  }
  // else if (req.cookies.token) {
  //   // we assign the token in the cookie to "token" variable
  //   // it's up to you to use the cookie or not
  //   token = req.cookies.token
  // }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    console.log(decoded)

    req.user = await User.findById(decoded.id)

    next()
  } catch (error) {
    return next(new ErrorResponse("Not authorized to access this route", 401))
  }
})

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      )
    }
    next()
  }
}
