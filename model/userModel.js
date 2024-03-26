const mongoose = require("mongoose");
// const userSchema = mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true },
//     password: { type: String, required: true },
//     dateOfBirth: { type: Date, required: true },
//     verified:Boolean
//   }
// );
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    dob: { type: Date, required: true },
    password: { type: String, required: true },
    verified: Boolean,
  },

  { timestamps: true, versionKey: false }
);
module.exports = mongoose.model("users", userSchema);
