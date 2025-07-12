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
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/nif-demo');
}
main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
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



app.listen(3000, () => {
    console.log("server is listening to port 3000");
});
