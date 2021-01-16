import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import postRoutes from './routes/posts.js'

const app = express();

app.use('/posts', postRoutes);

app.use(bodyParser.json({limit: "30mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

//connecting the server with mongodb database (mongodb/clous/atlas version)
<<<<<<< HEAD
const CONNECTION_URL = `mongodb+srv://user:${process.env.MONGO_PASSWORD}@cluster0.dryuj.mongodb.net/<dbname>?retryWrites=true&w=majority`;
=======
const CONNECTION_URL = 'mongodb+srv://user:user123@cluster0.dryuj.mongodb.net/<dbname>?retryWrites=true&w=majority';
>>>>>>> 9cc863a7ddbc1007294378448b314243e9d19d99
const PORT = process.env.PORT || 5000;

mongoose.connect(CONNECTION_URL, {useNewUrlParser: true, useUnifiedTopology: true} )
    .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
    .catch((error) => console.log(error.message));

mongoose.set('useFindAndModify', false);