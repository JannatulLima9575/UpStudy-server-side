const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.send('UpStudy Code is Cooking!');
});

// ✅ MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zmzpu5s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// ✅ MongoDB Client Initialization (Only once!)
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Declare collection globally
let articlesCollection;

async function run() {
  try {
    // ✅ Connect client
    await client.connect();

    const db = client.db('upstudy-server');
    articlesCollection = db.collection('articles');

    // ✅ All Articles
    app.get('/articles', async (req, res) => {
      const articles = await articlesCollection.find().toArray();
      res.send(articles);
    });

    // ✅ Featured Articles (Latest 6)
    app.get('/featured', async (req, res) => {
      const featured = await articlesCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.send(featured);
    });

    // ✅ Get Unique Categories
    app.get('/api/categories', async (req, res) => {
      const categories = await articlesCollection.distinct("category");
      res.json(categories);
    });

    // ✅ Filter Articles by Category
    app.get("/api/articles", async (req, res) => {
      const category = req.query.category;
      const filter = category ? { category } : {};
      const articles = await articlesCollection.find(filter).sort({ createdAt: -1 }).toArray();
      res.json(articles);
    });

    // ✅ Ping the database
    await db.command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB");

  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
  }
}
run().catch(console.dir);

// Start server
app.listen(port, () => {
  console.log(`🚀 UpStudy server running on port ${port}`);
});