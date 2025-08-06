require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const Product = require('./models/product');
const paypal = require('./services/paypal');

const app = express();

// EJS un Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'misty-dungeon-secret',
    resave: false,
    saveUninitialized: true,
  })
);

// MongoDB savienojums
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB savienots'))
  .catch((err) => console.error('MongoDB kļūda:', err));

// ----- ROUTES -----

// Galvenā lapa ar produktu sarakstu
app.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('index', { products });
  } catch (err) {
    res.send('Kļūda: ' + err.message);
  }
});

// Pievienot produktu grozam
app.post('/cart/add', async (req, res) => {
  const { id } = req.body;
  const product = await Product.findById(id);

  if (!req.session.cart) req.session.cart = [];
  req.session.cart.push({
    _id: product._id,
    name: product.name,
    price: product.price,
  });

  res.redirect('/cart');
});

// Groza skats
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, p) => sum + p.price, 0);
  res.render('cart', { cart, total });
});

// Noņemt produktu no groza
app.post('/cart/remove', (req, res) => {
  const { id } = req.body;
  if (!req.session.cart) req.session.cart = [];
  req.session.cart = req.session.cart.filter((item) => item._id.toString() !== id);
  res.redirect('/cart');
});

// Pirkuma apmaksa
app.post('/pay', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.send('Grozs ir tukšs!');

    const url = await paypal.createOrder(cart);
    res.redirect(url);
  } catch (error) {
    console.error(error);
    res.send('Kļūda: ' + error.message);
  }
});

// PayPal pirkuma pabeigšana
app.get('/complete-order', async (req, res) => {
  try {
    await paypal.capturePayment(req.query.token);

    // Samazinām pieejamo daudzumu par 1 katram produktam
    const cart = req.session.cart || [];
    for (const item of cart) {
      await Product.findByIdAndUpdate(item._id, { $inc: { quantity: -1 } });
    }

    req.session.cart = [];
    res.send('Pasūtījums veiksmīgi apmaksāts!');
  } catch (error) {
    console.error(error);
    res.send('Kļūda: ' + error.message);
  }
});

app.get('/cancel-order', (req, res) => {
  res.redirect('/cart');
});

app.listen(3000, () => console.log('Serveris palaists uz 3000 porta'));
