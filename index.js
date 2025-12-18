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
app.use(express.json())


const allowedOrigins = [
  "https://online-ticket-booking-ed0a4.web.app",
  "http://localhost:5173"
];
app.use(cors(
  
));

//JWT Token
// app.use(
//   cors({
//     origin: [process.env.SITE_DOMAIN
//     ],
//     credentials: true,
//     optionSuccessStatus: 200,
//   })
// )
// app.use(express.json());

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
    const db = client.db('plane-db')
    const ticketsCollection = db.collection('flights')
    const bookingsCollection = db.collection('bookings')
    const paymentCollection = db.collection('payment')
    const usersCollection = db.collection('users')

// Role middleware
const verifyADMIN = async (req,res,next) => {
  const email = req.tokenEmail
  const user = await usersCollection.findOne({ email })
  if( user?.role !== 'admin')
    return res.status(403)
  .send({message: 'Admin Only Action', role: user?.role})

  next()
}

const verifyVENDOR = async (req,res,next) => {
  const email = req.tokenEmail
  const user = await usersCollection.findOne({ email })
  if( user?.role !== 'vendor')
    return res.status(403)
  .send({message: 'Vendor Only Action', role: user?.role})

  next()
}

//
const verifyVendorNotFraud = async (req, res, next) => {
  const email = req.tokenEmail;
  const user = await usersCollection.findOne({ email });
  if (!user) {
    return res.status(401).send({ message: "User not found" });
  }
  if (user.role !== "vendor") {
    return res.status(403).send({ message: "Vendor only action" });
  }
  if (user.isFraud) {
    return res.status(403).send({ message: "You are marked as fraud" });
  }

  next();
};


    //Save Ticket data in db
 app.post(
  '/flights',
  verifyJWT,
  verifyVendorNotFraud,
  async (req, res) => {
    const ticketsData = {
      ...req.body,
      vendorEmail: req.tokenEmail,
      createdAt: new Date(),
  
    };

    const result = await ticketsCollection.insertOne(ticketsData);
    res.send(result);
  }
);



    //get all flights from mongodb
    app.get('/flights', async (req, res) => {
      const result = await ticketsCollection.find().toArray()
      res.send(result)
    })

    //details
    app.get('/flights/:id', async (req, res) => {
      const id = req.params.id

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      const flight = await ticketsCollection.findOne({ _id: new ObjectId(id) });
      if (!flight) return res.status(404).json({ message: "Flight not found" });
      res.json(flight);
    });

    //bookings
    app.post('/bookings', async (req, res) => {
      const booking = req.body;

      booking.status = "pending";
      booking.createdAt = new Date();

      const result = await bookingsCollection.insertOne(booking);

      res.json(result);
    });

    //get bookings for a customer
    app.get('/bookings/:email', async (req, res) => {
    
      const email = req.params.email;

      const bookings = await bookingsCollection
        .find({ customerEmail: email })
        .toArray();

      res.json(bookings);
    });

    //manage booking for a seller by email
     app.get('/requested-bookings', verifyJWT, async (req, res) => {
    
     const vendorEmail = req.tokenEmail  // 
     console.log(vendorEmail)
     const result = await bookingsCollection.find({ vendorEmail }).toArray()
     res.send(result)
})
  
    // update booking status
    app.patch('/bookings/status/:id', async (req, res) => {
      const { status } = req.body
      const id = req.params.id

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      const result = await bookingsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      )

      res.send(result)
    })

    // Get all tickets added by vendor
    app.get('/vendor-tickets/:email', async (req, res) => {
      const email = req.params.email;
      const tickets = await ticketsCollection.find({ vendorEmail: email }).toArray();
      res.json(tickets);
    });

    app.patch('/flights/:id', async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      const updatedData = req.body;

      const result = await ticketsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.json(result);
    });

    //Delete tickets by vendor
    app.delete('/flights/:id', async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      const result = await ticketsCollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    // Update verification status (approve/reject) by admin

    // update verification route
    app.patch('/flights/verify/:id', async (req, res) => {
  const { id } = req.params;
  const { verificationStatus } = req.body; // 'approved' বা 'rejected'

  const result = await ticketsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { verificationStatus } }
  );

  res.json(result);
});


    // GET /flights/all-approved
    app.get('/flights/all/approved', async (req, res) => {
      try {
        const tickets = await ticketsCollection.find({ verificationStatus: "approved" }).toArray();
        console.log("Approved tickets:", tickets);
        res.json(tickets);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", err });
      }
    });

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

     //get  user role
    app.get('/users/role',async(req, res) => {
  // console.log(req.tokenEmail)

  const result = await usersCollection.findOne({ email: req.query.email });
  
  res.send({ role: result?.role });
});

//get all users from db
app.get('/users',verifyJWT,async(req,res)=> {
  const adminEmail = req.tokenEmail
  const result = await usersCollection.find({ email: {$ne: adminEmail}}).toArray()
  res.send(result)
})

//update user role
app.patch('/users/role/:id', verifyJWT, async (req, res) => {
  const { role } = req.body; // 'admin' or 'vendor'
  const userId = req.params.id;

  const adminUser = await usersCollection.findOne({ email: req.tokenEmail });

  const result = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { role } }
  );

  res.send(result);
});


//make fraud
app.patch('/users/fraud/:id', verifyJWT, async (req, res) => {
  const userId = req.params.id;
  const adminUser = await usersCollection.findOne({ email: req.tokenEmail });
  const vendor = await usersCollection.findOne({ _id: new ObjectId(userId) });
  

  // mark as fraud
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isFraud: true } }
  );

  // hide vendor tickets
  await ticketsCollection.updateMany(
    { vendorEmail: vendor.email },
    { $set: { hidden: true } }
  );

  res.send({ message: 'Vendor marked as fraud' });
});

//mark as unfraud
app.patch("/users/unfraud/:id", verifyJWT, async (req, res) => {
  const { id } = req.params;

  const result = await usersCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isFraud: false } }
  );

  res.send(result);
});



    //Payment Chekout
    app.post('/create-checkout-session', async (req, res) => {
      const paymentInfo = req.body

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'USD',
              product_data: {
                name: paymentInfo?.title,
                images: [paymentInfo?.image],
              },
              unit_amount: Math.round(paymentInfo?.unitPrice * 100)
            },
            quantity: paymentInfo?.quantity,
          },
        ],
        customer_email: paymentInfo?.customerEmail,
        mode: 'payment',
        metadata: {
          bookingsId: paymentInfo?.bookingsId,
          customer_email: paymentInfo?.customerEmail,

        },
        success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/bookings/${paymentInfo?.bookingsId}`,
      })
      res.send({ url: session.url })
    })

    app.post('/payment-success', async (req, res) => {
      const { sessionId } = req.body
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent']  
      })
      const paymentIntent = session.payment_intent;

      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
      const paymentDate = new Date(charge.created * 1000);
      console.log(paymentDate)
      const ticket = await bookingsCollection.findOne({
        _id: new ObjectId(session.metadata.bookingsId)
      })
    

      const bookings = await paymentCollection.findOne({ transactionId: session.payment_intent, })
      if (session.status === 'complete' && ticket && !bookings) {
        //save data in db
        const orderInfo = {
          bookedId: session.metadata.bookingsId,
          transactionId: session.payment_intent,
          customer: session.customer_email,
          title: ticket.title,
          vendorName: ticket.vendorName,
          vendorEmail: ticket.vendorEmail,
          vendorImage: ticket.vendorImage,
          amount: session.amount_total / 100,
          paymentDate,
        }
        const result = await paymentCollection.insertOne(orderInfo)
        await bookingsCollection.updateOne(
      { _id: new ObjectId(session.metadata.bookingsId) },
      { $set: { status: "paid", quantity: 0 } }
    );
    

             await ticketsCollection.updateOne(
          {
            _id: new ObjectId(ticket.flightId),
          },
          { $inc: { quantity: -(ticket.quantity)} }
        )
        return res.send({
          transactionId: session.payment_intent,
          orderId: result.insertedId,
        })
      }
      res.send(res.send({
        transactionId: session.payment_intent,
        bookingsId: ticket?._id,
      }))
    })

    //get all payment History
    app.get('/payment/:email', async (req, res) => {
      const email = req.params.email;

      const payment = await paymentCollection
        .find({ customer: email })
        .toArray();

      res.json(payment);
    });

    //advertisement section
    app.get(
  '/admin/approved-tickets',
  verifyJWT,
  verifyADMIN,
  async (req, res) => {
    const result = await ticketsCollection
      .find({ verificationStatus: "approved" })
      .toArray();

    res.send(result);
  }
);

app.patch(
  '/admin/advertise-ticket/:id',
  verifyJWT,verifyADMIN,
  async (req, res) => {
    const id = req.params.id;
    const { advertise } = req.body; // true / false

    // count currently advertised tickets
    const advertisedCount = await ticketsCollection.countDocuments({
      isAdvertised: true,
    });

    if (advertise && advertisedCount >= 6) {
      return res.status(400).send({
        message: "You can not advertise more than 6 tickets"
      });
    }

    const result = await ticketsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isAdvertised: advertise } }
    );

    res.send(result);
  }
);

app.get('/advertised-tickets', async (req, res) => {
  const result = await ticketsCollection
    .find({ isAdvertised: true, verificationStatus: "approved" })
    .limit(6)
    .toArray();

  res.send(result);
});
//latest tickets collection
  // Latest 6 tickets from ticketsCollection
app.get('/latest-tickets', async (req, res) => {
  try {
    const latestTickets = await ticketsCollection
      .find()
      .sort({ createdAt: -1 }) // newest first
      .limit(6)
      .toArray();

    res.send(latestTickets);
  } catch (error) {
    console.error("Failed to fetch latest tickets:", error);
    res.status(500).send({ message: "Failed to fetch latest tickets" });
  }
});

// Vendor Revenue Overview
app.get('/vendor/revenue-overview/:email', async (req, res) => {
  try {
    const vendorEmail = req.params.email;

    const ticketsAdded = await ticketsCollection.countDocuments({ vendorEmail });

    const bookings = await bookingsCollection.find({ vendorEmail, status: "paid" }).toArray();

    const totalTicketsSold = bookings.reduce((acc, b) => acc + (b.totalPrice/b.unitPrice || 0), 0);
    const totalRevenue = bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
console.log( totalRevenue,
      totalTicketsSold,
      ticketsAdded)
    res.json({
      totalRevenue,
      totalTicketsSold,
      ticketsAdded
    });
    

  } catch (error) {
    console.error("Revenue Overview Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});




    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
