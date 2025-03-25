const mongoose = require("mongoose")
const slugify = require("slugify")
const geocoder = require("../util/geocoder")

const BootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"]
    },
    // slug: url friendly of a name, we'll use slugify
    slug: String,
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [500, "Description can not be more than 500 characters"]
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS"
      ]
    },
    phone: {
      type: String,
      maxlength: [20, "Phone number can not be longer than 20 characters"]
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email"
      ]
    },
    address: {
      type: String,
      required: [true, "Please add an address"]
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number],
        index: "2dsphere"
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String
    },
    careers: {
      // Array of strings
      type: [String],
      required: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other"
      ]
    },
    averageRating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [10, "Rating must can not be more than 10"]
    },
    averageCost: Number,
    photo: {
      type: String,
      default: "no-photo.jpg"
    },
    housing: {
      type: Boolean,
      default: false
    },
    jobAssistance: {
      type: Boolean,
      default: false
    },
    jobGuarantee: {
      type: Boolean,
      default: false
    },
    acceptGi: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false
  }
)

// Create bootcamp slug from the name
// .pre() is a Mongoose's middleware, help us to do stuff BEFORE some operation like: "save",...
BootcampSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true })
  // console.log("Slugify ran", this.name)
  next()
})

// Geocode & create location field
BootcampSchema.pre("save", async function (next) {
  const loc = await geocoder.geocode(this.address)
  this.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].country
  }

  // Do not save address in DB because we now have formattedAddress
  this.address = undefined
  next()
})

// Cascade delete courses when a bootcamp is deleted
// IMPORTANT: .pre("remove") won't work if we use findByIdAndDelete() method, we can instead use findById and then call remove() method on it
BootcampSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    console.log(`Courses being removed from bootcamp ${this._id}`)
    await this.model("Course").deleteMany({ bootcamp: this._id })
    console.log(`Reviews being removed from bootcamp ${this._id}`)
    await this.model("Review").deleteMany({ bootcamp: this._id })
    next()
  }
)

BootcampSchema.pre("findOneAndUpdate", function (next) {
  if (this.getUpdate().name) {
    this.set({ slug: slugify(this.getUpdate().name, { lower: true }) })
  }
  next()
})

// Reverse populate with virtuals
// find in the "Course" model all the bootcamp that has objectId matched this doc's _id
BootcampSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "bootcamp",
  justOne: false
})

module.exports = mongoose.model("Bootcamp", BootcampSchema)
