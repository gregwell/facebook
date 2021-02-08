# readme[THE FACEBOOK]

# 1. Project motivation

This is a self-development project that aims to teach me how *people make* awesome websites with the JavaScript. In this way I will get familiarity with good practices and get the general look how project structure should looks like. I've followed line by line the code that has been written and explained by Adrian Hajdin [[github](https://github.com/adrianhajdin/project_mern_memories)][[video](https://youtu.be/ngc9gnGgUdA)]. Later on I googled everything using phrases like "what is {something} used for?", opened countless amounts of stackoverflow questions and took notes, as follows. This project will be the basis for building something bigger on my own.

# 2. The original structure of the project

![images/project_structure.png](images/project_structure.png)

## Server side

- A server is software that listens via the internet and responds to incoming requests over HTTP.
- Server reply to these requests with things like HTML, CSS, JavaScript or raw data encoded in JSON.

### **index.js**

```jsx
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'

const app = express();

app.use(bodyParser.json({limit: "30mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

app.use('/posts', postRoutes);
app.use('/users', userRoutes);

//connecting the server with mongodb database (mongodb/clous/atlas version)

const CONNECTION_URL = `mongodb+srv://user:${process.env.MONGO_PASSWORD}@cluster0.dryuj.mongodb.net/<dbname>?retryWrites=true&w=majority`;
const PORT = process.env.PORT || 5000;

mongoose.connect(CONNECTION_URL, {useNewUrlParser: true, useUnifiedTopology: true} )
    .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
    .catch((error) => console.log(error.message));

mongoose.set('useFindAndModify', false);
```

1. **Defining the app instance as the return object of express().** Express is the framework that runs our HTTP server.
2. **Using body-parser.** Body parser is needed to handle **HTTP POST** requests. Body parser extract the entire body portion of an incoming request stream and exposes it on **req.body**. (as something easier to interface with)
    - bodyParser.json() - parses the text as json and exposes the resulting object on req.body
    - bodyParser.urlencoded() - parses the text as URL encoded data - this is how browsers tend to send form data from regular forms set to POST. Also, resulting object is exposed to req.body
3. **Using CORS.** The acronym stands for Cross-Origin Resource Sharing. As long as we have to face the same-origin policy JavaScript can only make calls to URLs that live on the same origin as the location where the script is running. CORS solves this problem allowing us to make requests from one website to another.
4. **Using the routers:** We import */routes/posts.js* and */routes/users.js* files where the routing is implemented. We choose the paths and call the routers (the default export object of these files is a router.
5. **Connecting to the database.** Firstly, we define the MongoDB database address and the the port we want to host our server on. 

    5.1 Creating connection with connection flags:

    - useNewUrlParser - uses new url parser - it's a big change from the past - this is why we need to use this flag
    - useUnifiedTopology - removes support of several connection options that are no longer relevant

    5.2 Enabling port listening nad console logging.

    5.3 Catching error - the console can print the error message if needed

    5.4 To opt in to using MongoDB's driver **findOneAndUpdate()** we need to set global option useFindAndModify to false.

### routes/posts.js & routes/users.js (same purpose)

```jsx
import express from 'express';
import { getPosts, createPost, updatePost, deletePost, likePost } from '../controllers/posts.js'
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPosts);
router.post('/', auth, createPost);
router.patch('/:id', auth, updatePost); 
router.delete('/:id', auth, deletePost); 
router.patch('/:id/likePost', auth, likePost);

export default router;
```

1. **Defining the router instance** as the result of express.Router(). 
2. **Linking http requests with authorization method and CRUD operations methods**
3. **Exporting the router to use it in index.js**

### controllers/posts.js

```jsx
import PostMessage from '../models/postMessage.js';
import mongoose from 'mongoose';

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

    const newPost = new PostMessage({...post, creator: req.userId, createdAt: new Date().toISOString()}); 

    try {
        await newPost.save();

        res.status(201).json(newPost);

    } catch (error) {
        res.status(409).json({message :error.message})
    }
}

export const updatePost = async (req,res) => {
    const { id: _id } = req.params;
    const post = req.body;
    if(!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send(`No post with id: ${_id}`);

    const updatedPost = await PostMessage.findByIdAndUpdate(_id, { ...post, _id}, {new: true});

    res.json(updatedPost);
}

export const deletePost = async (req,res) => {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No post with id: ${id}`);

    await PostMessage.findByIdAndRemove(id);

    res.json( {message: `The post with id: ${id} was deleted.`});
}

export const likePost = async (req, res) => {
    const { id } = req.params;

    if(!req.userId) return res.json({ message: 'Unauthenticated'});

    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No post with id: ${id}`);

    const post = await PostMessage.findById(id);

    const index = post.likes.findIndex((id) => id == String(req.userId));

    if(index=== -1) {
        //like
        post.likes.push(req.userId);
    } else {
        //dislike
        post.likes = post.likes.filter((id) => id !== String(req.userId)); 
        //returns an array of all the likes except current person like
    }

    const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {new: true});

    res.json(updatedPost);
}
```

1. **Importing the model of *postMessage*** from models/postMessage.js
2. **Handling GET requests**

    1. Getting the posts.

    - as long as *PostMessage* is our model, we can execute .find() method to find all posts
    - .***find()*** method returns an instance of Mongoose's Query class. The query class represents a raw CRUD operations that we can send to MongoDB

    2. Sending the response

    - ***res.json()*** sends a JSON response composed of the specified data.
    - ***res.status()*** set a status for the operation
3. **Handling POST requests**

    1.Catching the request body (*req.body* thanks to body-parser)

    2. Pasting the incoming data to the format of a model.

    - using property spread operator: "...post" to get all attributes of post
    - changing the ***creator*** to ***req.userId** - this is a variable that we got during authorization*
    - changing the ***createdAt*** to ***new Date().toISOString()*** - notice that .***toISOString()*** - always returns a timestamp in UTC, even if the date is in local mode.

    3. Sending the response: a model filled with data

4. **Handling PATCH requests**

    1. Catching the id given as param in the path (path/:id)

    2. Catching the request body

    3. Checking if the id from params is inside the database with mongoose **.Types.ObjectId.isValid**

    4. Calling **findByIdAndUpdate:**

    - providing _id as the id to query by
    - providing post, but using also the spread operator to get current post values, and adding _id at the end, because we are not willing to change it.
    - providing options { new: true) since defualt value is false (false is getting the same version of the post)

    5. Sending the updated post in json as the response.

5. **Handling DELETE requests**
    1. Catching the id given as param in the path (path/:id)
    2. Checking if the id from params is inside the database.
    3. Caling **findByIdAndRemove**  mongoose method on our model.
    4. Sending the response in json.
6. **Handling liking the posts**
    1. Catching the id given as param in the path (path/:id)
    2. Checking if the user is authenticated.
    3. Checking if the id from params is inside the database with mongoose.
    4. Calling **findById** method to find the post.
    5. Calling **findIndex** method on post.likes property. The findIndex() method returns the index of the **first element** in the array **that satisfies** the provided **testing function.** 
        - likes is the property is an array filled with strings with user ids that has liked the post
        - we provide id to the testing function, and compare this id with each id in the array
        - the index in the array of the first id that meet our condition is returned
    6. Implementing like mechanism
        - If the index is -1 then we could not find this id in the array, so the user with this id have not liked this post. Then we have to push this user id to the array, since this operation is about liking/disliking posts
        - When the response is other than -1 then we have found the id in the aray, so we have the index. Now we call **filter** method to leave in the array all elements that meet our condition, so all except the one from this request.
    7. Calling **findByIdAndUpdate** method to update the post

### models/postMessage.js & models/user.js (same purpose)

```jsx
import mongoose from 'mongoose'

const postSchema = mongoose.Schema({
    title: String,
    message: String,
    name: String,
    creator: String,
    tags: [String],
    selectedFile: String,
    likes: {
        type: [String], //array of user ids
        default: [],
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
});

const PostMessage = mongoose.model('PostMessage', postSchema);

export default PostMessage;
```

1. **Creating the schema** of a single post.
2. **Creating the model** of a single post
    - **Why we have both schema and model?** A schema represents the structure of a particular document, either completely or just a portion of the document. It's a way to express expected properties and values as well as constraints and indexes. A model defines a programming interface for interacting with the database (read, insert, update, etc). So a schema answers "what will the data in this collection look like?" and a model provides functionality like "Are there any records matching this query?".
3. **Exporting** created model.

### controllers/posts.js

```jsx
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/user.js';

export const signin = async (req,res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if(!existingUser) return res.status(404).json({ message: "User does not exist."});
      
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if(!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id}, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ result: existingUser, token });

    } catch (error) {
        res.status(500).json({message: 'Something went wrong'});
    }

};

export const signup = async (req,res) => {
    const { email, password, confirmPassword, firstName, lastName } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if(existingUser) return res.status(400).json({ message: "User already exist."});

        if(password !== confirmPassword)   return res.status(400).json({ message: "Password don't match."});

        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await User.create({ email, password: hashedPassword, name: `${firstName} ${lastName}`})
        const token = jwt.sign({ email: result.email, id: result._id}, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ result: result, token });
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Something went wrong'});
    }
}
```

1. **Handling user sign in. (post requests)**
    1. Catching email and password from request body(parsed by body-parser as req.body)
    2. Checking if user with this email is already in the database, if not returning appropriate status and message.
    3. Checking if the password is correct:
        - using asynchronous **bcrypt.compare** method to compare  the password from req.body to the password of found user. If password don't match, then return error and appropriate message.
    4. Creating a token - using **jwt.sign** method, providing email and id as wel as jwt secret, defining expiration time.
    5. Returning exisitingUser instance and token.
2. **Handling user sign up (post requests)**
    1. Catching all needed params from req.body
    2. Checking if the user already exists.
    3. Checking passwords correctness.
    4. Creating hashedPassword variable:
        - using asynchronous bcrypt.hash method to hash password from req.body
    5. Creating user instance, filling it with data and previously hashed password.
    6. Using **jwt.sign** to create a token.
    7. Returning newly created user and generated token.

### middleware/auth.js

```jsx
import jwt from 'jsonwebtoken';

 const auth = async (req, res, next) => {
     try {
         const token = req.headers.authorization.split(" ")[1];
         const isCustomAuth = token.length < 500;

         let decodedData;

         if(token && isCustomAuth) {
            decodedData = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decodedData?.id;
         } else {
             //google token
             decodedData = jwt.decode(token);
             req.userId = decodedData?.sub;
         }
        next();
     } catch (error) {
         console.log(error);
     }
 }

 export default auth;
```

1. Catching the token - the token has to be sent inside the header with the key authorization and value of the token preceded by "Bearer" and a space.
    - splitting the token and catching the second part, just after Bearer
2. Distinguishing the type of authorization (google OAuth or custom)
3. If the token has been found and it's custom auth
    - using **jwt.verify** to decode the token
    - saving user id in req.userId to be able to use it later
4. If google token
    - just decoding the token
    - saving user id (in google auth it is **sub)** in req.userId for further usage

**Decoding vs verifying:**

To sum up, decoding does not need the secret (remember decoding is just interpreting base64) and verifying/signing is does require it.

### .env

```c
MONGO_PASSWORD=hiddenPassword
JWT_SECRET=hiddenSecret
```

## Client side

**Questions and answers;**

### What is Redux?

Redux is a predictable state container for JavaScript apps

- **Predictable -** helps to write applications that **behave consistently,** run in different environments(client, server, native) and are **easy to test**
- **Centralized -** centralizing application's state and logic enables powerful capabilities like **undo/redo**, **state persistence** and much more.
- **Debuggable -** the Redux DevTools make it easy to trace **when, where and why the application's state changed,** also it enables a possibility do log changes, use "**time-travel debugging",** and even send complete error reports to a server
- **Flexible -** works with any UI layer, and has a large ecosystem of addons to fit everyone needs

### How to control flow happens in redux?

1. Whenever I want to **replace the state** in the store I have to **dispatch** an **action**
2. The **action** is caught by one or more **reducers.**
3. The **reducer/s** create a **new state** that combines the **old state**, and the **dispatched action.**
4. The **store subscribers** are notified that there is a **new state.**

### What are roles of components/containers/actions/action creators/store in redux?

**Store**

- holds the state
- when a new action arrives runs the dispatch → middleware → reducers pipeline
- notifies subscribers when the state is replaced by a new ona

**Components** 

- *dumb* view parts which are not aware of the state directly
- also called *"presentational components"*

**Containers** (components/containers - a way to structure the app)

- pieces of that view that are aware of the state using react-redux
- also called *"smart components"* or "*high order components"*

**Actions**

- carries a payload of information from the application to the store
- are plain JavaScript objects that must have a type attribute to indicate the type of action performed

**Action creators**

- DRY way of creating actions (not strictly necessary)

### What are differences between redux, react-redux, redux-thunk?

**redux** 

- flow with a single store - managing application state
- independent from React - can be used in whatever environment including vanilla js, react, angular etc.

**react-redux** - bindings between redux and react that:

- creates **containers** (*smart components*) that listen to the store's state
- prepares the props for
- rerender the *dumb* **components** (*presentational components)*

**redux-thunk**

- middleware that allows you to write **action creators** that return a function instead of an action
- the thunk can be used to delay the dispatch of an action or to dispatch only if a certain conditon is met
- **used mainly for async calls to api,** that dispatch another action on success/failure
- also logging, crash reporting, routing..

**Additional info:**

- only the minimal data should be put i the state
- we should add to the state only the values that we want to update when an event happens, and for which we want to make the component re-render.

### What is DOM/ReactDOM

- DOM is a model for structured document
- it applies to all documents (word documents, HTML pages, XML files)
- represents the structure of an document in platform/browser independent way
- For example, the browser downloads the HTML along with any referenced JS and CSS (and images, Flash etc.). The browser constructs the DOM from the HTML and renders it using the rules specified in the CSS. JS may manipulate the DOM when the page loads, when the user does something, or when any other event happens. When the DOM changes the browser updates what is displayed.
- **ReactDOM** is a package that provides DOM specific methods that can be used at the top level of a web app to enable an efficient way of managing DOM elements of the web page.

### public/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

1. Standard html file with only one html tag <div id="root"></div> inside body tags.

### index.js

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import { reducers } from './reducers';
import App from './App';
import './index.css';

const store = createStore(reducers, compose(applyMiddleware(thunk)))

 ReactDOM.render(
     <Provider store={store}>
          <App />
     </Provider>,
    document.getElementById('root')
);
```

1. Importing **ReactDOM** to gain access for managing DOM elements of a web page.
2. Importing **Provider** from react-redux. 
    - The <Provider> makes the Redux store available to any nested components that have been wrapped in the connect() function.
    - Since any React component in a React Redux app can be connected, most applications will render a <Provider> at the top level, with the entire app's component tree inside of it. **(as in our case).**
3. Importing redux methods to manage the store
    - **createStore(reducer, preloadedState**, **enhancer)**
        - **reducer** - reducers imported from reducers directory(composed from different files into one index.js)
        - **preloadedState** - the initial state, specified optionally
        - **enhancer** - specified optionally to enhance the store with third-party capabilities such as middleware, time travel, persistence
            - **compose()** used to apply multiple store enhancers
            - **applyMiddleware()** is the only store enhancer that ships with Redux
            - **thunk as argument -** the middleware from react-thunk that allows us to make async calls to api
    - the return object is a Store - the object that holds the complete state of the app
    - the only way to change its state is by dispatching actions.
    - you may also subscribe to the changes to its state to update the UI
4. Importing App to put it just inside the **Provider** tags.
5. Calling render method on ReactDOM to render the website
    - placing provider with previously created store inside this render method (and inside the Provider there is the App placed)
    - executing on the document .**getElementById("root")** method
        - in our index.html there is only one element: **<div id="root"></div>**

# 3. Further development