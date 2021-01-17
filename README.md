# THE FACEBOOK

This is a self-development project that aims to teach me how *people make* awesome websites with the JavaScript. To focus 100% on practice I've followed line by line the code that has been written and explained by Adrian Hajdin [[github](https://github.com/adrianhajdin/project_mern_memories)][[video](https://youtu.be/ngc9gnGgUdA)]. Later on I googled everything using phrases like "what is {something} used for?", opened countless amounts of stackoverflow questions and took notes, as follows. This project will be the basis for building something bigger on my own.

# 1. The original structure of the project

![images/project_structure.png](images/project_structure.png)

## 1.1 Server side

- A server is software that listens via the internet and responds to incoming requests over HTTP.
- Server reply to these requests with things like HTML, CSS, JavaScript or raw data encoded in JSON.

### **1.1.1 index.js**

```jsx
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import postRoutes from './routes/posts.js'

const app = express();

app.use(bodyParser.json({limit: "30mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

app.use('/posts', postRoutes);

//connecting the server with mongodb database (mongodb/clous/atlas version)

const CONNECTION_URL = `mongodb+srv://user:${process.env.MONGO_PASSWORD}@cluster0.dryuj.mongodb.net/<dbname>?retryWrites=true&w=majority`;
const PORT = process.env.PORT || 5000;

mongoose.connect(CONNECTION_URL, {useNewUrlParser: true, useUnifiedTopology: true} )
    .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
    .catch((error) => console.log(error.message));

mongoose.set('useFindAndModify', false);
```

What we do here:

1. **Defining the app instance as the return object of express().** Express is the framework that runs our HTTP server.
2. **Using body-parser.** Body parser is needed to handle **HTTP POST** requests. Body parser extract the entire body portion of an incoming request stream and exposes it on **req.body**. (as something easier to interface with)
    - bodyParser.json() - parses the text as json and exposes the resulting object on req.body
    - bodyParser.urlencoded() - parses the text as URL encoded data - this is how browsers tend to send form data from regular forms set to POST. Also, resulting object is exposed to req.body
3. **Using CORS.** The acronym stands for Cross-Origin Resource Sharing. As long as we have to face the same-origin policy JavaScript can only make calls to URLs that live on the same origin as the location where the script is running. CORS solves this problem allowing us to make requests from one website to another.
4. **Using the routing:** For now we only import */routes/posts.js* file where the routing is implemented. We choose the path and call the router (the router is the object returned from posts.js file.
5. **Connecting to the database.** Firstly, we define the MongoDB database address and the the port we want to host our server on. 

    5.1 Creating connection with connection flags:

    - useNewUrlParser - uses new url parser - it's a big change from the past - this is why we need to use this flag
    - useUnifiedTopology - removes support of several connection options that are no longer relevant

    5.2 Enabling port listening nad console logging.

    5.3 Catching error - the console can print the error message if needed

    5.4 To opt in to using MongoDB's driver **findOneAndUpdate()** we need to set global option useFindAndModify to false.

### 1.1.2 routes/posts.js

```jsx
import express from 'express';
import { getPosts, createPost } from '../controllers/posts.js'

const router = express.Router();

router.get('/', getPosts);
router.post('/', createPost);

export default router;
```

1. **Defining the router instance** as the result of express.Router(). 
2. **Linking the get and post methods to their bodies** in /controllers/posts.js.
3. **Exporting the router to use it in index.js**

### 1.1.3 controllers/posts.js

```jsx
import PostMessage from '../models/postMessage.js';

export const getPosts = async (req, res) => {
    try {
        const postMessages = await PostMessage.find();
        res.status(200).json(postMessages);
    } catch (error) {
        res.status(404).json({message:error.message});
    }
}

export const createPost = async (req, res) => {
    const post = req.body;

    const newPost = new PostMessage(post); 

    try {
        await newPost.save();

        res.status(201).json(newPost);

    } catch (error) {
        res.status(409).json({message :error.message})
    }
}
```

1. **Importing the model of postMessage** from models/postMessage.js
2. **Creating the routing for GET request.**

    2.1 Getting the posts.

    - the purpose of get method in our example is to return all posts in the database
    - as PostMessage is our model, we can execute .find() method to find all posts
    - find() method returns an instance of Mongoose's Query class. The query class represents a raw CRUD operations that we can send to MongoDB

    2.2 Sending the response

    - res.json() sends a JSON response composed of the specified data.
    - res.status(200) set the success status for the operation
3. **Creating the routing for POST request.**

    3.1 Requesting the body of incoming request stream with req.body

    3.2 Pasting the incoming data to the format of a model.

    3.3 Sending the response: 

    - status 201-created
    - sending a json response composed of newly created post (a model filled with data).

### 1.1.4 models/postMessage.js

```jsx
import mongoose from 'mongoose'

const postSchema = mongoose.Schema({
    title: String,
    message: String,
    creator: String,
    tags: [String],
    selectedFile: String,
    likeCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
});

const PostMessage = mongoose.model('PostMessage', postSchema);

export default PostMessage;
```

1. **Creating the schema** of a single post.
2. **Creating the model** of a single post
    - **Why we have both schema and model?** A schema represents the structure of a particular document, either completely or just a portion of the document. It's a way to express expected properties and values as well as constraints and indexes. A model defines a programming interface for interacting with the database (read, insert, update, etc). So a schema answers "what will the data in this collection look like?" and a model provides functionality like "Are there any records matching this query?".
3. **Exporting** created model.