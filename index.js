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

    // get all tasks of a user
    app.get("/tasks/user/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };

        // Assuming userCollection is a MongoDB collection
        const user = await userCollection.findOne(query);

        if (!user) {
          return res
            .status(404)
            .send({ success: false, message: "User not found" });
        }

        const tasks = user.tasks || []; // Use an empty array if tasks is null
        res.send(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });

    app.delete('/tasks/:email/:taskId', async (req, res) => {
      const userEmail = req.params.email;
      const taskId = req.params.taskId;
    
      try {
        const result = await userCollection.updateOne(
          { email: userEmail },
          { $pull: { tasks: { tid: taskId } } }
        );
    
        if (result.modifiedCount === 1) {
          res.status(200).json({ success: true, message: 'Task deleted successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Task not found' });
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    app.get('/tasks/user/:email/:taskId', async (req, res) => {
      const userEmail = req.params.email;
      const taskId = req.params.taskId;
    
      try {
        const user = await userCollection.findOne({ email: userEmail });
    
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
    
        const taskToEdit = user.tasks.find((task) => task.tid === taskId);
    
        if (!taskToEdit) {
          return res.status(404).json({ success: false, message: 'Task not found' });
        }
    
        res.status(200).json({ success: true, task: taskToEdit });
      } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });


    app.put('/tasks/user/:email/:taskId', async (req, res) => {
      const userEmail = req.params.email;
      const taskId = req.params.taskId;
      const updatedTaskData = req.body;
    
      try {
        const result = await userCollection.updateOne(
          { email: userEmail, 'tasks.tid': taskId },
          { $set: { 'tasks.$': updatedTaskData } }
        );
    
        if (result.modifiedCount === 1) {
          res.status(200).json({ success: true, message: 'Task updated successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Task not found or not updated' });
        }
      } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
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
