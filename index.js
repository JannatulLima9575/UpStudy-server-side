require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.send('🚀 UpStudy Code is Cooking!');
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
let usersCollection;

async function run() {
  try {
    // await client.connect();
    const db = client.db('upstudy-server');
    articlesCollection = db.collection('articles');
    commentsCollection = db.collection('comments');
    usersCollection = db.collection('users');

    // USERS ROUTES
    app.put("/api/users/:email", async (req, res) => {
      const email = req.params.email;
      const userData = req.body;
      const result = await usersCollection.updateOne(
        { email },
        { $set: userData },
        { upsert: true }
      );
      res.send(result);
    });

    app.get("/api/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send(user);
    });

    // ARTICLES
    app.get("/api/articles", async (req, res) => {
      const { email, category, tag } = req.query;
      console.log("email" ,email, "category", category, "tag",tag);
      
      const filter = {};
      if (email) filter.authorEmail = email;
      if (category) filter.category = category;
      if (tag) {
        const tagArray = Array.isArray(tag) ? tag : [tag];
        filter.tags = { $in: tagArray };
      }
      try {
        const articles = await articlesCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .toArray();
        res.json(articles);
      } catch (err) {
        res.status(500).json({ message: "Error fetching articles" });
      }
    });

    app.get('/api/categories', async (req, res) => {
      try {
        const categories = await articlesCollection.distinct("category");
        res.json(categories);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch categories" });
      }
    });

    app.get('/api/tags', async (req, res) => {
      try {
        const tags = await articlesCollection.distinct("tags");
        res.send(tags);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch tags" });
      }
    });

    app.get("/api/featured", async (req, res) => {
      const featured = await articlesCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.json(featured);
    });

    app.post("/api/articles", async (req, res) => {
      const newArticle = req.body;
      newArticle.createdAt = new Date();
      newArticle.likes = 0;
      const result = await articlesCollection.insertOne(newArticle);
      res.send(result);
    });

    app.get("/api/articles/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const article = await articlesCollection.findOne({ _id: new ObjectId(id) });
        if (!article) {
          return res.status(404).send({ message: "Article not found" });
        }
        res.send(article);
      } catch (err) {
        res.status(500).send({ message: "Error retrieving article" });
      }
    });

    app.patch("/api/articles/:id/like", async (req, res) => {
      const id = req.params.id;
      const result = await articlesCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { likes: 1 } },
        { returnDocument: "after" }
      );
      res.send(result.value);
    });

    app.delete("/api/articles/:id", async (req, res) => {
      const id = req.params.id;
      const { authorEmail } = req.body;
      const article = await articlesCollection.findOne({ _id: new ObjectId(id) });
      if (!article) {
        return res.status(404).json({ success: false, message: "Article not found" });
      }
      if (article.authorEmail !== authorEmail) {
        return res.status(403).json({ success: false, message: "Unauthorized to delete" });
      }
      const result = await articlesCollection.deleteOne({ _id: new ObjectId(id) });
      res.json({ success: result.deletedCount === 1 });
    });

    app.put("/api/articles/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const article = await articlesCollection.findOne({ _id: new ObjectId(id) });
      if (!article) {
        return res.status(404).json({ success: false, message: "Article not found" });
      }
      if (article.authorEmail !== updatedData.authorEmail) {
        return res.status(403).json({ success: false, message: "Unauthorized to update" });
      }
      const result = await articlesCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            title: updatedData.title,
            content: updatedData.content,
            category: updatedData.category,
            tags: updatedData.tags,
            thumbnail: updatedData.thumbnail,
            updatedAt: new Date()
          }
        }
      );
      res.json({ success: result.modifiedCount > 0 });
    });

    // COMMENTS
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

    app.get("/api/comments", async (req, res) => {
      const { articleId } = req.query;
      const filter = articleId ? { articleId } : {};
      const comments = await commentsCollection.find(filter).sort({ createdAt: -1 }).toArray();
      res.send(comments);
    });

    app.get("/api/user-comments", async (req, res) => {
      const { email } = req.query;
      const comments = await commentsCollection.find({ userEmail: email }).toArray();
      res.send(comments);
    });

    app.patch("/api/comments/:id/like", async (req, res) => {
      const id = req.params.id;
      const result = await commentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { likes: 1 } },
        { returnDocument: "after" }
      );
      res.send(result.value);
    });

    app.delete("/api/comments/:id", async (req, res) => {
      const id = req.params.id;
      const result = await commentsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // await db.command({ ping: 1 });
    // console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed", err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚀 UpStudy server running on port ${port}`);
});