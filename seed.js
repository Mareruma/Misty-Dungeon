require('dotenv').config()
require('./services/mongo')
const Product = require('./models/product')

async function seed() {
  const products = [
    { name: "DnD minifigūriņa", slug: "minifigurina", description: "Mazs detalizēts varonis", price: "50.00", quantity: 10 },
    { name: "Warrior ar zobenu", slug: "warrior", description: "Stingrs tēls ar zobenu", price: "45.00", quantity: 5 },
    { name: "Mazais Pūķis (resin)", slug: "dragon", description: "Resīna figūra ar sīkumiem", price: "60.00", quantity: 3 },
    { name: "Burvju Grāmata (prop)", slug: "book", description: "Dekoratīva grāmata", price: "25.00", quantity: 8 },
    { name: "Dungeon meistara ekrāns", slug: "dm-screen", description: "Klasisks DM rīks", price: "35.00", quantity: 7 },
    { name: "Tokenu komplekts (30 gab.)", slug: "tokens", description: "30 tokeni dažādām lomām", price: "20.00", quantity: 15 },
    { name: "Elfu arbaletnieks", slug: "elf", description: "Detalizēta elfa figūra", price: "48.00", quantity: 6 },
    { name: "Apburtā lāde", slug: "mimic", description: "Lāde ar pārsteigumu", price: "30.00", quantity: 4 },
    { name: "Spēļu karšu komplekts", slug: "cards", description: "Komplekts ar 52 kārtīm", price: "15.00", quantity: 20 },
    { name: "Krāsotāja komplekts (pamatkrāsas)", slug: "paint-kit", description: "Pamatkrāsas miniatūrām", price: "22.00", quantity: 10 },
    { name: "Tumšā Orka figūra", slug: "orc", description: "Agresīvs tumšais orks", price: "55.00", quantity: 2 }
  ]

  await Product.deleteMany({})
  await Product.insertMany(products)
  console.log('Produkti saglabāti MongoDB')
  process.exit()
}

seed()
