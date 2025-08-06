require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const paypal = require('./services/paypal');
const Product = require('./models/product');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sesijas grozam
app.use(
    session({
        secret: 'misty_dungeon_secret',
        resave: false,
        saveUninitialized: true
    })
);

// MongoDB savienojums
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB savienots'))
    .catch((err) => console.error('MongoDB kļūda:', err));

// Galvenā lapa
app.get('/', async (req, res) => {
    const products = await Product.find();
    res.render('index', { products, cart: req.session.cart || [] });
});

// Pievieno produktus grozam
app.post('/add-to-cart', async (req, res) => {
    const product = await Product.findById(req.body.productId);
    if (!req.session.cart) req.session.cart = [];
    req.session.cart.push({
        id: product._id,
        name: product.name,
        price: product.price
    });
    res.redirect('/');
});

// Noņem no groza
app.post('/remove-from-cart', (req, res) => {
    const id = req.body.productId;
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter((item) => item.id !== id);
    }
    res.redirect('/');
});

// Maksājums ar PayPal
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

// Pasūtījuma apstiprinājums
app.get('/complete-order', async (req, res) => {
    try {
        await paypal.capturePayment(req.query.token);
        req.session.cart = []; // Iztukšo grozu
        res.send('Pasūtījums veiksmīgi apmaksāts!');
    } catch (error) {
        console.error(error);
        res.send('Kļūda: ' + error.message);
    }
});

app.get('/cancel-order', (req, res) => {
    res.redirect('/');
});

app.listen(3000, () => console.log('Serveris palaists uz 3000 porta'));
