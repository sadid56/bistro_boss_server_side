const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 8000;


//middlewar
app.use(cors({
  origin: ['http://localhost:5173']
}))
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
    const UsersCollection = client.db('BistroDB').collection('users')
    const rivewsCollection = client.db('BistroDB').collection('rivews')
    const cardCollection = client.db('BistroDB').collection('cards')

    //CRUD operation

    //jwt related
    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECURE_TOKEN, {expiresIn: '1hr'})
      res.send({token})
    })

      // middlewares
      const verifyToken = (req, res, next) =>{
        console.log('inside verify token',req.headers);
        if(!req.headers.authorization){
          return res.status(401).send({message: 'forbidden access'})
        }
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, process.env.JWT_SECURE_TOKEN, (err, decoded)=>{
          if(err){
            return res.status(401).send({message: 'forbidden access'})
          }
          req.decoded = decoded;
          next()
        })
        // next()
      }

      // verifyAdmin
      const verifyAdmin = async(req, res, next)=>{
        const email = req.decoded?.email;
        const query = {email: email}
        const user = await UsersCollection.findOne(query)
        const isAdmin = user?.role === 'admin';
        if(isAdmin){
          return res.status(403).send({message: 'forbidden access'})
        }
      }

    //usres realated
    app.post('/users', async(req, res)=>{
      const user = req.body;
      // console.log(user);
      //user email don'nt exist
      const query = {email: user?.email}
      const existingUser = await UsersCollection.findOne(query)
      if(existingUser){
        return res.send({message: 'user already create account', insertedId: null})
      }
      const result = await UsersCollection.insertOne(user)
      res.send(result)
    })
    app.get('/users', verifyToken, async(req, res)=>{
    
      const result = await UsersCollection.find().toArray()
      res.send(result)
  })

    app.get('/users/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: 'unauthorized access'})
      }

      const query = {email: email}
      const user = await UsersCollection.findOne(query)
      let admin = false;
      if(user){
        admin = user?.role === 'admin'
      }
      res.send({admin})
    })

  app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await UsersCollection.deleteOne(query)
    res.send(result)
  })

  app.patch('/users/:id', verifyToken, verifyAdmin, async(req, res)=>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const  updateRol = {
      $set:{
        role: 'admin'
      }
    }
    const result = await UsersCollection.updateOne(filter, updateRol)
    res.send(result)
  })
    //menu related
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