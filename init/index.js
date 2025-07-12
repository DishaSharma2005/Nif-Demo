//  index.js
// main();
const mongoose = require("mongoose");
const data = require("./data");
const Innovator = require("../models/innovator");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/nif-demo");
  for (let entry of data) {
  const exists = await Innovator.findOne({ applicationNumber: entry.applicationNumber });
  if (!exists) {
    await Innovator.create(entry);
    console.log("✅ Inserted:", entry.name);
  } else {
    console.log("⏩ Skipped:", entry.name);
  }
}

  mongoose.connection.close();
}
main();

