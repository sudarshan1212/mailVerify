const mongoose = require("mongoose");
const dbConnection = async () => {
  try {
    const connect = await mongoose.connect(process.env.CONNECTION);
    console.log(
      "CONNECTION: " + mongoose.connection.name,
      mongoose.connection.host
    );
  } catch (error) {
    process.exit(1);
    console.log(error);
  }
};

module.exports = dbConnection;
