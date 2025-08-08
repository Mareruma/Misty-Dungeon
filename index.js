require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const paypal = require('./services/paypal');
const Product = require('./models/product');

// Importē mongo savienojumu (tam jau jāizveido savienojums)
require('./services/mongo');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        secret: 'misty_dungeon_secret',
        resave: false,
        saveUninitialized: true
    })
);

// Galvenā lapa
app.get('/', async (req, res) => {
    const products = await Product.find();
    res.render('index', { products, cart: req.session.cart || [] });
});

// Pievienot produktu grozam
app.post('/add-to-cart', async (req, res) => {
    try {
        const product = await Product.findById(req.body.productId);
        if (!product) return res.send('Produkts nav atrasts');
        if (!req.session.cart) req.session.cart = [];

        req.session.cart.push({
            id: product._id.toString(),
            name: product.name,
            price: product.price
        });

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.send('Kļūda pievienojot grozam');
    }
});

// Noņemt produktu no groza
app.post('/remove-from-cart', (req, res) => {
    const idToRemove = req.body.productId;
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.id !== idToRemove);
    }
    res.redirect('/');
});

// Maksājuma uzsākšana ar PayPal
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
        req.session.cart = []; // Notīra grozu pēc maksājuma
        res.send('Pasūtījums veiksmīgi apmaksāts!');
    } catch (error) {
        console.error(error);
        res.send('Kļūda: ' + error.message);
    }
});

// Atcelts pasūtījums
app.get('/cancel-order', (req, res) => {
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris palaists uz ${PORT} porta`));
