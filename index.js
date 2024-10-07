const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();

// Use CORS middleware
// Middleware to parse JSON request bodies
const FRONTEND_ORIGIN = 'https://dashboard-fiverr-nodejs.vercel.app';

// CORS Configuration
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional: Log incoming request origins
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  next();
}); // For parsing application/x-www-form-urlencoded

const mongoURI = 'mongodb+srv://shiwanshaggarwal2004:YPvS4SDJwKc59iUv@cluster0.ueomq.mongodb.net/';
const dbName = 'test';

// Function to fetch data from MongoDB based on the device number
async function fetchDataByDevice(collectionName, deviceNo) {
    const client = new MongoClient(mongoURI);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Fetch documents where the device number matches the parameter
        
        const documents = await collection.find({ deviceno: parseInt(deviceNo) }).toArray();
        console.log(documents);
        return documents;
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        throw error;
    } finally {
        await client.close();
    }
}

// API route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

// Login API (same as before)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
  }

  const client = new MongoClient(mongoURI);

  try {
      await client.connect();
      const db = client.db(dbName);
      const usersCollection = db.collection('users');

      const user = await usersCollection.findOne({ email });
      if (!user) {
          return res.status(400).json({ message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid email or password.' });
      }

      // Explicitly send a JSON response with status 201
      return res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
      return res.status(500).json({ message: 'Error logging in', error });
  } finally {
      await client.close();
  }
});


// Signup API (same as before)
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
  }

  const client = new MongoClient(mongoURI);

  try {
      await client.connect();
      const db = client.db(dbName);
      const usersCollection = db.collection('users');

      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: 'Email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
          username,
          email,
          password: hashedPassword
      };

      await usersCollection.insertOne(newUser);

      // Explicitly send a JSON response with status 201
      return res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
      return res.status(500).json({ message: 'Error registering user', error });
  } finally {
      await client.close();
  }
});


// Fetch data from the "ON_OFF_data" collection based on deviceNo
app.get('/ONOff', async (req, res) => {
    const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('ON/OFF_data');  // Corrected collection name

        // Retrieve all documents from the collection and convert to an array
        const data = await collection.find().toArray();

        // Respond with the data (not the MongoClient object)
        return res.json({ data });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ message: err.message });
    }
});



// Fetch data from the "machine_threshold" collection based on deviceNo
app.get('/machine_threshold/:deviceNo', async (req, res) => {
    const { deviceNo } = req.params;

    try {
        const data = await fetchDataByDevice('machine_threshold', deviceNo);
        return res.json({ message: data });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ message: err.message });
    }
});


app.get('/machine_threshold', async (req, res) => {
    const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('machine_threshold');  // No leading slash

        // Assuming "deviceId" is the field that stores the device ID
        const uniqueDeviceIds = await collection.distinct('deviceno');
        return res.json({ uniqueDeviceIds });
    } catch (err) {
        console.error('Error:', err);
        return  res.status(500).json({ message: err.message });
    } finally {
        await client.close();  // Ensure the client is closed
    }
});



// Fetch data from the "shiftwise_data" collection based on deviceNo
app.get('/shiftwise/:deviceNo', async (req, res) => {
    const { deviceNo } = req.params;

    try {
        const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("shiftwise_data");
        const data =  await collection.find({ "_id.deviceno": parseInt(deviceNo) }).toArray();
        ;
        return res.json({ message: data });
    } catch (err) {
        console.error('Error:', err);
        return   res.status(500).json({ message: err.message });
    }
});


app.get('/shiftwise', async (req, res) => {


  try {
      const client = new MongoClient(mongoURI, { connectTimeoutMS: 60000 });
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection("shiftwise_data");
      const data =  await collection.find().toArray();
     
      return res.json({ message: data });
  } catch (err) {
      console.error('Error:', err);
      return  res.status(500).json({ message: err.message });
  }
});


app.post('/add_operator', async (req, res) => {
  const { name, userID } = req.body;

  if (!name || !userID) {
      return res.status(400).json({ message: 'Operator name and userID are required.' });
  }

  const client = new MongoClient(mongoURI);

  try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('operators');

      const result = await collection.insertOne({ name, userID });

      // Explicitly send a JSON response with status 201
      return res.status(201).json({ message: 'Operator added successfully', operatorId: result.insertedId });
  } catch (err) {
      return res.status(500).json({ message: 'Internal server error', error: err.message });
  } finally {
      await client.close();
  }
});


  app.get('/get_operators_by_userid/:userID', async (req, res) => {
    try {
      const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('operators');
      
      // Get the userID from query parameters
      const { userID } = req.params;
  
      // Validate that userID is provided
      if (!userID) {
        return res.status(400).json({ message: 'userID is required.' });
      }
  
      // Fetch operators based on the userID
      const operators = await collection.find({ userID }).toArray();
  
      // Respond with the list of operators
      return res.status(200).json({ operators });
    } catch (err) {
      console.error('Error fetching operators:', err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    } 
  });
  

  // POST /save_operator_selection endpoint
  app.post('/save_operator_selection', async (req, res) => {
    // Extract data from request body
    const { deviceno, channel, date, shift, operatorId } = req.body;
  
    // Validate required fields
    if (!deviceno || !channel || !date || !shift || !operatorId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
  
    const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
  
    try {
      // Connect to MongoDB
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('save_operator_selection');
  
      // Generate a unique _id using composite fields
      const _id = `${deviceno}_${channel}_${shift}_${date}`;
  
      // Check if a document with the same _id already exists
      const existingSelection = await collection.findOne({ _id });
  
      if (existingSelection) {
        // If it exists, update the document
        const updatedSelection = await collection.updateOne(
          { _id }, // Filter to find the document
          {
            $set: { deviceno, channel, date, shift, operatorId }, // Fields to update
          }
        );
        return  res.status(200).json({ message: 'Operator selection updated successfully.', updatedSelection });
      } else {
        // If it doesn't exist, create a new document
        const newSelection = {
          _id,
          deviceno,
          channel,
          date,
          shift,
          operatorId,
        };
        await collection.insertOne(newSelection);
        return res.status(201).json({ message: 'Operator selection saved successfully.', newSelection });
      }
    } catch (error) {
      console.error('Error saving operator selection:', error);
      return res.status(500).json({ message: 'Error saving operator selection.', error: error.message });
    } finally {
      await client.close();
    }
  });
  
  
  app.get('/get_operator_selections', async (req, res) => {
    const client = new MongoClient(mongoURI, { connectTimeoutMS: 600000 });
  
    try {
      // Connect to the MongoDB client
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('save_operator_selection'); // Use your collection name
  
      // Fetch all documents from the collection
      const data = await collection.find().toArray();
  
      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error fetching data: ' + error.message);
      return res.status(500).json({ message: 'Error fetching data', error: error.message });
    } 
  });
 

  app.post('/reasons', async (req, res) => {
    try {
      const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('Reasons');
  
      // Get the operator data and userID from the request body
      const { reason, userID ,additionalDetails} = req.body;
  
      // Validate that both name and userID are provided
      if (!reason || !userID) {
        return res.status(400).json({ message: 'Operator name and userID are required.' });
      }
  
      // Insert the new operator into the collection with the userID
      const result = await collection.insertOne({ reason, userID ,additionalDetails});
  
      // Respond with success
      return res.status(201).json({ message: 'Operator added successfully', operatorId: result.insertedId });
    } catch (err) {
      console.error('Error adding operator:', err);
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    } 
  });



  app.post('/save_off_reasons', async (req, res) => {
    const { reasons } = req.body; // expects { reasons: [...] }
    const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('save_off_reasons');
 
    try {
      // Insert many reasons into the database
      await collection.insertMany(
        reasons.map(item => ({
          deviceNo: item.deviceno,
          channel: item.channel,
          date: item.date,
          time: item.time,
          status: item.status,
          shift: item.shift,
          endDate: item.enddate,
          endTime: item.endtime,
          reason: item.reason,
        }))
      );
      return res.status(200).json({ message: 'Reasons saved successfully' });
    } catch (error) {
      console.error('Error saving reasons:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });


  app.get('/get_Reasons/:userID', async (req, res) => {
    const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
  
    try {
      // Connect to the MongoDB client
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('Reasons'); // Use your collection name
      const { userID } = req.params;
      // Fetch all documents from the collection
      const data = await collection.find({userID:userID}).toArray();
  
      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error fetching data: ' + error.message);
      return res.status(500).json({ message: 'Error fetching data', error: error.message });
    } 
  })

  app.get('/get_Reasons', async (req, res) => {
    const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
  
    try {
      // Connect to the MongoDB client
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('Reasons'); // Use your collection name
  
      // Fetch all documents from the collection
      const data = await collection.find({}).toArray();
  
      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error fetching data: ' + error.message);
      return res.status(500).json({ message: 'Error fetching data', error: error.message });
    } 
  })


  app.get('/get_save_off_reasons', async (req, res) => {
    const client = new MongoClient(mongoURI, { connectTimeoutMS: 30000 });
  
    try {
      // Connect to the MongoDB client
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('save_off_reasons'); // Use your collection name
  
      // Fetch all documents from the collection
      const data = await collection.find({}).toArray();
  
      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error fetching data: ' + error.message);
      return  res.status(500).json({ message: 'Error fetching data', error: error.message });
    } 
  })
// Serve the static React app (if you are serving React from the same server)


// Start the server on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
