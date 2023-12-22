const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// connect to database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k5v5ibx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// api routes
async function run() {
  try {
    // await client.connect();
    const userCollection = client.db("taskDB").collection("users");

    // save a user to the database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = user.email;
      const query = { email: email };
      const exists = await userCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, user: exists });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get user by email id
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    //get the user from db and add task to user tasks array
    app.post("/tasks/create/:email", async (req, res) => {
      const email = req.params.email;
      const task = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $push: {
          tasks: task,
        },
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    
  } finally {
    // await client.close(console.log("database is closed"));
  }
}
run().catch((err) => console.log(err));

// initial api routes and listen.
app.get("/", (req, res) => {
  res.send("task manager server is online");
});

app.listen(port, () => {
  console.log(`task manager server listening on port ${port}`);
});
