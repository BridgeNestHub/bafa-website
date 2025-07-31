## MongoDB:
username: kkedir
password: rnU2Ebj871Cq5GZW


mongodb+srv://kkedir:rnU2Ebj871Cq5GZW@clusterfornonprofit.p0txine.mongodb.net/?retryWrites=true&w=majority&appName=ClusterForNonProfit

Full code:
```bash
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://kkedir:rnU2Ebj871Cq5GZW@clusterfornonprofit.p0txine.mongodb.net/?retryWrites=true&w=majority&appName=ClusterForNonProfit";

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
    await client.close();
  }
}
run().catch(console.dir);
```