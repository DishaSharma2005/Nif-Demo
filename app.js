const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const Innovator = require('./models/innovator');
const sampleData = require("./init/data"); 
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

const moment=require("moment");
const dbUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/nif-demo";
require("dotenv").config();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);


app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(session({
  secret: "secretkey123",
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires:Date.now()+ 7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,

  }
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ✅ Connect Mongo
// async function main() {
//     await mongoose.connect('mongodb://127.0.0.1:27017/nif-demo');
// }
// main().then(() => {
//     console.log("connected to DB");
// }).catch((err) => {
//     console.log(err);
// });


mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});



app.get("/", async (req, res) => {
  try {
    const data = await Innovator.find({});
  res.render("details/index", { data });
  } catch (err) {
    console.error("❌ Error loading data:", err);
    res.send("Error displaying table.");
  }
});


app.get("/details/new", (req, res) => {
    res.render("details/new");
});


app.post('/innovators', async (req, res) => {
    try {
        const { innovator } = req.body;
        console.log(" Saving:", innovator);
        await Innovator.create(innovator);
        res.redirect('/');
    } catch (err) {
        console.error("❌ Error saving:", err);
        res.send("Error saving innovator.");
    }
});
app.get('/innovators/:id/edit', async (req, res) => {
  const { id } = req.params;
  try {
    const found = await Innovator.findById(id);
    if (!found) return res.send("Innovator not found");
    res.render('details/edit', { innovator: found });
  } catch (err) {
    console.error("❌ Edit Route Error:", err);
    res.send("Error loading edit form");
  }
});
app.put("/innovators/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { innovator } = req.body;

    await Innovator.findByIdAndUpdate(id, innovator, { runValidators: true, new: true });
    res.redirect("/");
  } catch (err) {
    console.error("❌ Update Error:", err);
    res.send("Error updating innovator.");
  }
});

//Delete 


app.delete('/innovators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Innovator.findByIdAndDelete(id);
    req.flash('success', 'Innovator deleted successfully.');
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting innovator:', err);
    req.flash('error', 'Error deleting the innovator.');
    res.redirect('/');
  }
});
//Search 
app.get('/search', async (req, res) => {
  const { name } = req.query;

  try {
    const data = await Innovator.findOne({ name: { $regex: new RegExp(name, 'i') } });

    if (!data) {
      return res.status(404).json({});
    }

    res.json(data); // ✅ returns JSON to your script.js
  } catch (err) {
    console.error("❌ Search route error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/notifications", async (req, res) => {
  const allInnovators = await Innovator.find({});
  const groupedNotifications = {
    pending: [],
    hearing: [],
    psFiled: [],
    annual: []
  };

  const today = moment();

  allInnovators.forEach(innovator => {
    const { _id, name, status = "", dateOfGrant = "" } = innovator;

    const statusLower = status.toLowerCase();
    const link = `/details/${_id}`;

    const hasAnnualReminder = /reminder/i.test(statusLower) || /reminder/i.test(dateOfGrant.toLowerCase());


    const rawDate = dateOfGrant.split("(")[0].trim();
    const grantDate = moment(rawDate, ["DD/MM/YYYY", "YYYY-MM-DD"], true);
    const hasValidDate = grantDate.isValid();
    const diffInMonths = hasValidDate ? today.diff(grantDate, "months") : null;

    // ✅ 1. Pending Cases (Even if date is invalid, show basic reminder)
    if (statusLower.includes("pending") || statusLower.includes("awaiting")) {
      const msg = hasValidDate && diffInMonths >= 12
        ? `Reminder: ${name}'s case "${status}" — follow-up needed (12+ months).`
        : `Reminder: ${name}'s case "${status}" — follow-up may be needed (no grant date).`;
      groupedNotifications.pending.push({ msg, link });
    }

    // ✅ 2. Application in Hearing
    if (statusLower.includes("application in hearing")) {
      const msg = hasValidDate && diffInMonths >= 12
        ? `Reminder: ${name}'s application is still in hearing — ${diffInMonths} months passed.`
        : `Reminder: ${name}'s application is in hearing — follow-up may be needed (no grant date).`;
      groupedNotifications.hearing.push({ msg, link });
    }

    // ✅ 3. PS Filed
    if (statusLower.includes("ps filed")) {
      const msg = hasValidDate && diffInMonths >= 12
        ? `Reminder: ${name}'s PS Filed case — follow-up needed (12+ months).`
        : `Reminder: ${name}'s PS Filed case — follow-up may be needed (no grant date).`;
      groupedNotifications.psFiled.push({ msg, link });
    }

    // ✅ 4. Annual Reminders
    if (hasAnnualReminder && hasValidDate) {
  const anniversary = grantDate.clone().year(today.year());
  const daysDiff = Math.abs(today.diff(anniversary, 'days'));

  if (daysDiff <= 3) {
    const msg = `Annual Reminder: ${name}'s granted application was on ${rawDate}.`;
    groupedNotifications.annual.push({ msg, link });
  }
}

  });
 

  console.log("Grouped Notifications:");
  console.log(groupedNotifications);

  res.render("notifications", { groupedNotifications });
});

// Show page of details of innovator 
app.get("/details/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const innovator = await Innovator.findById(id);
    if (!innovator) return res.status(404).send("Innovator not found");

    res.render("details/show", { innovator });
  } catch (err) {
    res.status(500).send("Server error");
  }
});


// New Notifications 
app.get("/api/notifications/latest", async (req, res) => {
  const latestEntry = await Innovator.find({})
    .sort({ updatedAt: -1 }) // Or use createdAt if needed
    .limit(1);

  const latest = latestEntry.length ? latestEntry[0].updatedAt : new Date();
  res.json({ latest });
});


app.listen(3000, () => {
    console.log("server is listening to port 3000");
});
