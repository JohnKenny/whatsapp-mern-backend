import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';


// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1072675',
    key: 'a7906ac28ac6c9a777f7',
    secret: '247bf70d726d80f1dd7d',
    cluster: 'eu',
    encrypted: true
  });

// DB config
const connection_url = 'mongodb+srv://admin:CRm1hozhAK5fxReG@cluster0.jiod8.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// middleware
app.use(express.json());
app.use(cors()); // sets Headers

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.setHeader('Access-Control-Allow-Headers', '*')
//     next();
// });



const db = mongoose.connection
db.once('open', () => {
    console.log("db connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log("A change has taken place", change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                }
            );
        } else {
            console.log('Error triggering Pusher')
        }


    });
}); 

// api routes
app.get('/', (req, res) => res.status(200).send('Ola mundo'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

// route to post messages to monodb
app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

// listeners
app.listen(port, () => console.log(`Listening on localhost:${port}`))