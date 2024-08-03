// providers/mongodb.js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const csv = require('csv-parser');


const url = 'mongodb://localhost:27017';
const dbName = 'gowell';
let db;

const connectDB = async () => {
  if (db) {
    return db;
  }
  
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

const importCSVData = async (filePath, collectionName) => {

  const db = getDB();

  const collection = db.collection(collectionName);
  
  const records = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => records.push(row))
      .on('end', async () => {
        try {
          await collection.insertMany(records);
          console.log(`${records.length} records inserted.`);
          resolve();
        } catch (error) {
          console.error('Error inserting records:', error);
          reject(error);
        }
      });
  });
};

module.exports = {
  connectDB,
  getDB,
  importCSVData
};
