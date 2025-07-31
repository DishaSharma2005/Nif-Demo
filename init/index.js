const mongoose = require("mongoose");
const Innovator = require("../models/innovator");
const data = require("./data");
require("dotenv").config({ path: "../.env" });

const dbUrl = process.env.MONGO_URL;
console.log("🌐 Using DB URL:", dbUrl);  // <-- ADD THIS LINE

async function seedDB() {
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB Atlas");

    await Innovator.deleteMany({});
    await Innovator.insertMany(data);

    console.log("✅ Data seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  }
}

seedDB();
