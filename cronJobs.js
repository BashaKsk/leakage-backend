
const cron = require('node-cron');
const moment = require('moment');
const { getDB } = require('./providers/mongodb');


//Cron jobs to check every 4 hours if the DATE_TIME is expired of the current date 
//it will update the one in to pending one.

cron.schedule('0 */4 * * *', async () => {
    try {
        const db = getDB();
        const collection = db.collection('leakagedata');

        
        const now = moment();

       
        const expiredDocuments = await collection.find({
            DATE_TIME: { $lt: now.toDate() }, 
            isPending: { $ne: true }
        }).toArray();

        if (expiredDocuments.length > 0) {
          
            await collection.updateMany(
                { dateField: { $lt: now.toDate() }, isPending: { $ne: true } },
                { $set: { isPending: true } }
            );
            console.log('Updated expired documents to isPending: true');
        } else {
            console.log('No expired documents to update');
        }
    } catch (error) {
        console.error('Error updating expired documents:', error);
    }
});
