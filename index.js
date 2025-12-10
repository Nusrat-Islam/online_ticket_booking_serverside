require('dotenv').config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const admin = require("firebase-admin");
 const serviceAccount = require("./serviceAccountKey.json");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString(
  'utf-8'
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const app = express()
const port = 3000



//middleware

// plane-db:b3OoGvXbcgd8qeWA


//JWT Token
app.use(
  cors({
    origin: [
      'http://localhost:5173',
    //   'http://localhost:5174',
    //   'https://b12-m11-session.web.app',
    ],
    credentials: true,
    optionSuccessStatus: 200,
  })
)
app.use(express.json());

// jwt middlewares
const verifyJWT = async (req, res, next) => {
  const token = req?.headers?.authorization?.split(' ')[1]
  console.log(token)
  if (!token) return res.status(401).send({ message: 'Unauthorized Access!' })
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.tokenEmail = decoded.email
    console.log(decoded)
    next()
  } catch (err) {
    console.log(err)
    return res.status(401).send({ message: 'Unauthorized Access!', err })
  }
}


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


    const db =client.db('plane-db')
    const ticketsCollection = db.collection('flights')

    //Save Ticket data in db
    app.post('/flights',async(req,res)=>{
     const ticketsData = req.body
     console.log(ticketsData)
     const result = await ticketsCollection.insertOne(ticketsData) 
     res.send(result)  
    })

  //get all flights from mongodb
  app.get('/flights',async(req,res)=> {
    const result = await ticketsCollection.find().toArray()
    res.send(result)
  }) 



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
