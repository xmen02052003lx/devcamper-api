const express = require("express")
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/users")

const User = require("../models/User")

const router = express.Router({ mergeParams: true }) // we need mergeParams in order for router.use("/:bootcampId/courses", courseRouter) in routes/bootcamps.js to work

const advancedResults = require("../middleware/advancedResults")
const { protect, authorize } = require("../middleware/auth")

// what happened is everything below this will use this middleware, so we dont have to stick each route with this "protect" and "authorize" middleware
router.use(protect)
router.use(authorize("admin"))

router.route("/").get(advancedResults(User), getUsers).post(createUser)

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser)

module.exports = router
