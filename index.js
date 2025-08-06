require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const paypal = require('./services/paypal')
require('./services/mongo')
const Product = require('./models/Product')
const session = require('express-session')

const app = express()

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
  secret: 'tavsSuperSlepenaisVards',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // 1h sesijas laiks
}))

// Mājaslapa - produkti
app.get('/', async (req, res) => {
  const products = await Product.find()
  res.render('index', { products })
})

// Pievieno produktu grozam
app.post('/cart/add/:slug', async (req, res) => {
  const slug = req.params.slug
  const product = await Product.findOne({ slug })
  if (!product) return res.send('Produkts nav atrasts')

  if (!req.session.cart) req.session.cart = {}

  if (!req.session.cart[slug]) {
    req.session.cart[slug] = { 
      name: product.name,
      price: product.price,
      quantity: 0,
      slug: product.slug
    }
  }

  req.session.cart[slug].quantity += 1
  res.redirect('/cart')
})

// Groza lapas rādīšana
app.get('/cart', async (req, res) => {
  const cart = req.session.cart || {}
  res.render('cart', { cart })
})

// Maksāšanas process ar visu grozu
app.post('/pay/cart', async (req, res) => {
  try {
    const cart = req.session.cart
    if (!cart || Object.keys(cart).length === 0) {
      return res.send('Grozs ir tukšs')
    }

    // Pārbauda vai visiem produktiem ir pietiekami daudz daudzuma DB
    for (const slug of Object.keys(cart)) {
      const product = await Product.findOne({ slug })
      if (!product) return res.send(`Produkts ${slug} nav atrasts`)
      if (product.quantity < cart[slug].quantity) {
        return res.send(`Nav pietiekami daudzums produktam: ${product.name}`)
      }
    }

    // Izveido PayPal pasūtījumu ar visiem groza produktiem
    const items = Object.values(cart).map(item => ({
      name: item.name,
      description: item.name,
      quantity: item.quantity,
      unit_amount: {
        currency_code: 'EUR',
        value: item.price
      }
    }))

    // Aprēķina kopējo summu
    const total = Object.values(cart).reduce((sum, item) => sum + item.quantity * parseFloat(item.price), 0).toFixed(2)

    // Izveido pasūtījumu PayPal API tieši šeit
    const url = await paypal.createOrderWithItems(items, total)

    // Saglabā groza saturu sesijā, lai pēc apmaksas samazinātu daudzumus
    req.session.cartForOrder = cart

    res.redirect(url)
  } catch (error) {
    console.error(error)
    res.send('Kļūda: ' + error.message)
  }
})

// Pēc maksājuma - apstiprinājums un daudzumu atjaunošana
app.get('/complete-order', async (req, res) => {
  try {
    await paypal.capturePayment(req.query.token)

    // Samazina daudzumus pēc veiksmīgas apmaksas
    const cart = req.session.cartForOrder || {}

    for (const slug of Object.keys(cart)) {
      const product = await Product.findOne({ slug })
      if (product) {
        product.quantity -= cart[slug].quantity
        if (product.quantity < 0) product.quantity = 0
        await product.save()
      }
    }

    // Iztukšo sesijas grozu
    req.session.cart = {}
    req.session.cartForOrder = {}

    res.send('Pasūtījums veiksmīgi apmaksāts!')
  } catch (error) {
    console.error(error)
    res.send('Kļūda: ' + error.message)
  }
})

app.get('/cancel-order', (req, res) => {
  res.redirect('/')
})

app.listen(3000, () => console.log('Serveris palaists uz 3000 porta'))
