
const express = require('express');
const { connectDB, getDB, importCSVData } = require('./providers/mongodb');
const path = require('path');
const app = express();
const cors = require('cors');
const port = 3000;
const bodyParser = require('body-parser');
require('./cronJobs');
const moment = require('moment');

const now = moment();




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

connectDB().then(async () => {

    const csvFilePath = path.join(__dirname, 'Leakageformtasksampledata.csv');
    await importCSVData(csvFilePath, 'leakagedata');

    app.get('/data', async (req, res) => {
        let type = req.query.type;
    
        const validTypes = ['saved', 'pending', 'today'];
    
        // Validate filter type
        if (!validTypes.includes(type)) {
            type = 'all';
        }
    
        const queryFilters = {
            'all': {},
            'saved': { isSaved: true },
            'pending': { isPending: true },
            'today': {
                DATE_TIME: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                isSaved: { $ne: true },
                isPending: { $ne: true }
            }
        };
    
        const filter = queryFilters[type];
        const page = parseInt(req.query.page, 10) || 1; 
        const limit = 30; 
        const skip = (page - 1) * limit;
    
        try {
            const db = getDB();
            const collection = db.collection('leakagedata');
    
            
            const totalCount = await collection.countDocuments(filter);
    
           
            const data = await collection.find(filter).skip(skip).limit(limit).toArray();
    
           
            res.json({ data, totalCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    
    app.post('/save', async (req, res) => {
        try {
            const db = getDB();
            const collection = db.collection('leakagedata');
            const data = req.body;

            const filter = { _id: data._id };

            const updateOperation = {
                $set: { ...data, isSaved: true }
            };

            const result = await collection.updateOne(filter, updateOperation, { upsert: true });

            if (result.matchedCount === 0) {
                res.status(404).json({ message: 'Document not found' });
            } else {
                res.status(200).send({ message: 'Data updated successfully' });
            }
        } catch (error) {
            res.status(500).send(error.toString());
        }
    });


    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
});
