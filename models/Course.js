const mongoose = require("mongoose")

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a course title"]
  },
  description: {
    type: String,
    required: [true, "Please add a description"]
  },
  weeks: {
    type: String,
    required: [true, "Please add number of weeks"]
  },
  tuition: {
    type: Number,
    required: [true, "Please add a tuition cost"]
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add a minimum skill"],
    enum: ["beginner", "intermediate", "advanced"]
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  }
})

// Static method to get avg of course tuition
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId }
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" }
      }
    }
  ])

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost: obj.length > 0 ? Math.ceil(obj[0].averageCost) : 0
    })
  } catch (err) {
    console.log(err)
  }
}

// Call getAverageCost after save
CourseSchema.post("save", async function () {
  await this.constructor.getAverageCost(this.bootcamp)
})

// Call getAverageCost after ("post") remove. BECAUSE: if we use "pre",  it will trigger getAverageCost() first before deleted the review.
CourseSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function () {
    await this.constructor.getAverageCost(this.bootcamp)
  }
)

module.exports = mongoose.model("Course", CourseSchema)
