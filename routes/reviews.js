const express = require("express")
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview
} = require("../controllers/reviews")

const Review = require("../models/Review")

const router = express.Router({ mergeParams: true }) // we need mergeParams in order for router.use("/:bootcampId/reviews", reviewRouter) in routes/bootcamps.js to work

const advancedResults = require("../middleware/advancedResults")
const { protect, authorize } = require("../middleware/auth")

router
  .route("/")
  .get(
    advancedResults(Review, {
      path: "bootcamp",
      select: "name description"
    }),
    getReviews
  )
  .post(protect, authorize("user", "admin"), addReview)

router
  .route("/:id")
  .get(getReview)
  .put(protect, authorize("user", "admin"), updateReview)
  .delete(protect, authorize("user", "admin"), deleteReview)

module.exports = router
