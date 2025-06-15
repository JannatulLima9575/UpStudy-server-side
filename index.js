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

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let articlesCollection;

async function run() {
  try {
    await client.connect();
    const db = client.db('upstudy-server');
    articlesCollection = db.collection('articles');

    // ✅ Get all or filter by category/email
    app.get("/api/articles", async (req, res) => {
      const { email, category } = req.query;
      const filter = {};
      if (email) filter.authorEmail = email;
      if (category) filter.category = category;

      const articles = await articlesCollection.find(filter).sort({ createdAt: -1 }).toArray();
      res.json(articles);
    });

    // newArticle.createdAt = new Date();
    
        // ✅ All Articles
    app.get('/articles', async (req, res) => {
      const articles = await articlesCollection.find().toArray();
      res.send(articles);
    });

    // ✅ Get Featured (latest 6)
    app.get("/api/featured", async (req, res) => {
      const featured = await articlesCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.json(featured);
    });

    // ✅ Post new article
    app.post("/api/articles", async (req, res) => {
      const newArticle = req.body;
      const result = await articlesCollection.insertOne(newArticle);
      res.send(result);
    });

    // ✅ Get categories
    app.get('/api/categories', async (req, res) => {
      const categories = await articlesCollection.distinct("category");
      res.json(categories);
    });

    // ✅ MongoDB ping
    await db.command({ ping: 1 });
    console.log("✅ Connected to MongoDB");

  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
  }
}
run().catch(console.dir);

// Start server
app.listen(port, () => {
  console.log(`🚀 UpStudy server running on port ${port}`);
});