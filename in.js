require('dotenv').config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const serviceAccount = require("./serviceAccountKey.json");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString(
  'utf-8'
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const app = express()
const port = 3000
app.use(cors())
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zpccury.mongodb.net/?appName=Cluster0`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    const db = client.db('plane-db')
    const ticketsCollection = db.collection('flights')
    const bookingsCollection = db.collection('bookings')
    const paymentCollection = db.collection('payment')
    const usersCollection = db.collection('users')


 //Save or update a user iin db
    app.post('/users',async (req, res) => {
      const userData = req.body
  console.log(userData)
      //new or old user checked
      userData.created_at = new Date().toISOString()
      userData.last_loggedIn = new Date().toISOString()
      userData.role = 'user'
      const query = {
        email: userData.email
      }
      const alreadyExist = await usersCollection.findOne(query)
      console.log('user Already exist', !!alreadyExist)
      if (alreadyExist) {
      console.log('updating user info')
      const result = await usersCollection.updateOne(query, {
          $set: {
            last_loggedIn: new Date().toISOString(),
          },

        })
        return res.send(result)
      }
      console.log('saving new user info', userData)
      const result = await usersCollection.insertOne(userData)
      res.send(userData)
    })
  
}catch(e) {
    console.log(e)
}
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})