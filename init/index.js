// //  index.js
// // main();
// const mongoose = require("mongoose");
// const data = require("./data");
// const Innovator = require("../models/innovator");

// async function main() {
//   await mongoose.connect("mongodb://127.0.0.1:27017/nif-demo");
//   for (let entry of data) {
//   const exists = await Innovator.findOne({ applicationNumber: entry.applicationNumber });
//   if (!exists) {
//     await Innovator.create(entry);
//     console.log("✅ Inserted:", entry.name);
//   } else {
//     console.log("⏩ Skipped:", entry.name);
//   }
// }

//   mongoose.connection.close();
// }
// main();
const mongoose = require("mongoose");
const Innovator = require("../models/innovator");
const data = require("./data"); 
require("dotenv").config({ path: "../.env" });

const dbUrl = process.env.MONGO_URL;

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



