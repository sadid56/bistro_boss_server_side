const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 8000;

//bistro_boss
//ws43EMVY7hLyHYWD
//middlewar
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dzbhwpo.mongodb.net/?retryWrites=true&w=majority`;

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
    const menuCollection = client.db('BistroDB').collection('menu')
    const rivewsCollection = client.db('BistroDB').collection('rivews')
    const cardCollection = client.db('BistroDB').collection('cards')

    //CRUD operation
    //menu get
    app.get('/menu', async(req, res)=>{
        const result = await menuCollection.find().toArray()
        res.send(result)
    })
    app.get('/rivews', async(req, res)=>{
        const result = await rivewsCollection.find().toArray()
        res.send(result)
    })

    // add card related
    app.post('/cards', async(req, res)=>{
      const card = req.body;
      const result = await cardCollection.insertOne(card)
      res.send(result)
    })

    app.get('/cards', async(req, res)=>{
      const email = req.query.email;
      const query = {email: email}
      const result = await cardCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/cards/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cardCollection.deleteOne(query)
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('bistro boss server running')
})

app.listen(port, ()=>{
    console.log(`bistro boss ${port}`);
})