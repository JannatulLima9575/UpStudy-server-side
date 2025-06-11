const express = require('express')
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('UpStudy Code is Cooking!')
})



// // Get 6 latest articles
// router.get('/featured', async (req, res) => {
//   const articles = await Article.find().sort({ createdAt: -1 }).limit(6);
//   res.json(articles);
// });


// // Get all unique categories
// router.get('/categories', async (req, res) => {
//   const categories = await Article.distinct("category");
//   res.json(categories);
// });

// //Category-Based Article Page
// router.get('/category/:name', async (req, res) => {
//   const articles = await Article.find({ category: req.params.name });
//   res.json(articles);
// });

// from mongodb cluster
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zmzpu5s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`UpStudy Code sever is running on port ${port}`)
})