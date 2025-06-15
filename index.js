const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zmzpu5s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
  }
});

let articlesCollection;
let commentsCollection;

async function run() {
  try {
    await client.connect();
    const db = client.db('upstudy-server');
    articlesCollection = db.collection('articles');
    commentsCollection = db.collection('comments');

    // Articles APIs
    app.get("/api/articles", async (req, res) => {
      const { email, category } = req.query;
      const filter = {};
      if (email) filter.authorEmail = email;
      if (category) filter.category = category;

      const articles = await articlesCollection.find(filter).sort({ createdAt: -1 }).toArray();
      res.json(articles);
    });

    app.get('/articles', async (req, res) => {
      const articles = await articlesCollection.find().toArray();
      res.send(articles);
    });

    app.get("/api/featured", async (req, res) => {
      const featured = await articlesCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.json(featured);
    });

    app.post("/api/articles", async (req, res) => {
      const newArticle = req.body;
      const result = await articlesCollection.insertOne(newArticle);
      res.send(result);
    });

    app.get('/api/categories', async (req, res) => {
      const categories = await articlesCollection.distinct("category");
      res.json(categories);
    });

    // Comment APIs

    // Post new comment
    app.post("/api/comments", async (req, res) => {
      const comment = req.body;
      const newComment = {
        articleId: comment.articleId,
        userId: comment.userId,
        userName: comment.userName,
        userPhoto: comment.userPhoto,
        commentText: comment.commentText,
        likes: 0,
        createdAt: new Date(),
      };

      const result = await commentsCollection.insertOne(newComment);
      res.send(result);
    });

    // Get all comments or filter by articleId
    app.get("/api/comments", async (req, res) => {
      const { articleId } = req.query;
      const filter = articleId ? { articleId } : {};
      const comments = await commentsCollection.find(filter).sort({ createdAt: -1 }).toArray();
      res.send(comments);
    });

    // Like (increment likes by 1)
    app.patch("/api/comments/:id/like", async (req, res) => {
      const id = req.params.id;
      const result = await commentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { likes: 1 } },
        { returnDocument: "after" }
      );
      res.send(result.value);
    });

    // Delete comment by ID
    app.delete("/api/comments/:id", async (req, res) => {
      const id = req.params.id;
      const result = await commentsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // MongoDB ping
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