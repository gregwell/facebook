# The Facebook - project analysis

# Motivation

The main purpose of this self-development project is to give me an overview of a typical React-powered project and let me see how *the real development process* looks like from scratch. The project uses MERN stack technologies (MongoDB, Express, React, Node.js)

I've followed line by line Adrian Hajdin's [tutorial code](https://github.com/adrianhajdin/project_mern_memories), then googled "what is *everything* used for?", opened countless amounts of stackoverflow questions and took [notes](https://github.com/gregwell/university-notes/tree/main/english/javascript). This README file shows my way of thinking **how things are done.**

# The original structure of the project

![images/project_structure.png](images/project_structure.png)

# Server side

- A server is software that listens via the internet and responds to incoming requests over HTTP.
- Server reply to these requests with things like HTML, CSS, JavaScript or raw data encoded in JSON.

## **index.js**

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

## routes/posts.js & routes/users.js (same purpose)

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

## controllers/posts.js

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

## models/postMessage.js & models/user.js (same purpose)

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

## controllers/posts.js

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

## middleware/auth.js

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

## .env

```c
MONGO_PASSWORD=hiddenPassword
JWT_SECRET=hiddenSecret
```

# Client side

## public/index.html

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

1. Standard html file with only one root div inside body tags.

## index.js

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

## App.js

```jsx
import React from 'react';
import { Container} from '@material-ui/core';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import Auth from './components/Auth/Auth';

const App = () => (
    <BrowserRouter>
        <Container maxWidth="lg">
            <Navbar/>
            <Switch>
                <Route path="/" exact component={Home}/>
                <Route path="/auth" exact component={Auth}/>
            </Switch>
        </Container>
    </BrowserRouter> 
);

export default App;
```

1. Importing Container from @material-ui/core.
    - Container centers the content horizontally - it's the most basic layout element
    - The Container width can be bounded by the **maxWidth** property value
        - lg, md, sm, xl, xs or false (false disables maxWidth)
2. Importing BrowserRouter, Switch and Route from ReactRouterDOM (ReactRouterDOM - bindings for ReactRouter)
3. Importing components
4. Creating tree-structured App, consisting of BrowserRouter → Container → Navbar & Switch (with ReactRouter Routes inside)
    - using <Route **component**> render method to render the components when their location matches

**Caution**: [ReactRouter docs](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/Route.md#route-render-methods) indicates that the recommend method of rendering something with a <Route> is to use children elements. The version from above is mostly for apps built with earlier versions of the router before hooks were introduced. Try to change it later! 

## components/Navbar/Navbar.js

***PART 1:***

```jsx
import React, { useState, useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { AppBar, Avatar, Typography, Toolbar, Button } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import decode from 'jwt-decode';
import useStyles from './styles';

const Navbar = () => {
    const classes = useStyles();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('profile')));
    const dispatch = useDispatch();
    const history = useHistory();
    const location = useLocation();

    const logout = () => {
        dispatch({ type: 'LOGOUT' });
        history.push('/');
        setUser(null);
    };

    useEffect(() => {
        const token = user?.token;
        if(token) {
            const decodedToken = decode(token);
            if(decodedToken.exp * 1000 < new Date().getTime()) logout();
        }
        setUser(JSON.parse(localStorage.getItem('profile')));
    }, [location]);
      
        return (
            //PART 2 : rendering DOM elements
        );
};

export default Navbar;
```

1. To focus on the logic behind all that stuff, styling part will be considered later.
2. Using useState hook to return a stateful value and a function to update it.
    - during the initial render, the returned state(`user`) is the same as the value passed as the first argument. `JSON.parse(localStorage.getItem('profile'))`.
    - The `JSON.parse()` method parses a JSON string, constructing the JavaScript value or object described by the string.
    - The `getItem()` method of the Storage interface, when passed a key name, will return that key's value, or null if the key does not exist, in the given Storage object.
    - **So we get the logged user profile item from localStorage if there is any, if there isn't null is returned.**
3. Logout method:
    1. Dispatching an action type "LOGOUT" to be caught by a reducer
    2. Using ReactRouter's `useHistory` hook that provides a history interface to change the current location, **and in effect to rerender the view.**
    3. Setting the user to null because he has been logged out.
4. Using useEffect hook 
    - **Passing `[location]` as the second argument to conditionally fire this effect only when the location change.** (by default it runs after each render)
    1. Catching a user token, if there is any
    2. IF `token` exists:
        - decoding the `token`
        - if `token` has expired logging out the user.
    3. Setting user by parsing the value of profile item from local storage.
        - if the user exists it can be done successfully, if not the user will be set to null

***PART 2: rendering DOM elements***

```jsx
<AppBar className={classes.AppBar} position="static" color="inherit">
     <div className={classes.brandContainer}>
        <Typography component={Link} to="/" className={classes.heading} variant="h2" align="center">thefacebook</Typography>
     </div>
     <Toolbar className={classes.toolbar}>
          {user ? (
             <div className={classes.profile}>
                <Avatar className={classes.purple} alt={user.result.name} src={user.result.imageUrl}>{user.result.name.charAt(0)}</Avatar>
                <Typography className={classes.userName} variant="h6">{user.result.name}</Typography>
                <Button variant="contained" className={classes.logout} color="secondary" onClick={logout}>Logout</Button>
		         </div>
          ) : (
          <Button component={Link} to="/auth" variant="contained" color="primary" >Sing in</Button>
          )}
     </Toolbar>
</AppBar>
```

1. Using the following material-ui components:
    - *AppBar* **-** displays information and actions relating to the current screen
    - *Typography* **-**  used to present the design and the content as clearly as possible
        - Why Typography? ****Too many type sizes and styles at once can spoil any layout. A typographic scale has a limited set of type sizes that work well together along with the layout grid.
    - *Toolbar* **-** is a wrapper where you can place elements in a horizontal line (like a tool bet)
2. Using *div* component for styling.
3. Using ReactRouter *Link* ****to navigate to "/" (home) of application inside Typography component. 
4. If user is logged in:
    1. Displaying image avatar or letter avatar if the image doesn't exist.
        - image avatar - by specifying alt=name and src=photoSrc
        - letter avatar - by passing a string as `children` + adding styling class
    2. Printing user name as `{user.result.name}`
    3. Displaying a logout button
        - *contained* - contained buttons are high-emphasis, distinguished by their use of elevation and fill; contain actions that are primary for application to work.
        - *onClick* - executing `logout` function
5. If user is not logged in:
    1. Displaying a sign in button
        - Providing a ReactRouter *Link* to navigate to *Auth* page
        - *contained* - because of it key function.

## components/Home/Home.js

***PART 1:***

```jsx
import React, { useState, useEffect } from 'react';
import { Container, Grow, Grid } from '@material-ui/core';
import {useDispatch} from 'react-redux';
import {getPosts} from '../../actions/posts';
import Posts from '../Posts/Posts';
import Form from '../Form/Form';

const Home = () => {
    const [currentId, setCurrentId] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getPosts());
    }, [currentId, dispatch]);

    return (
				//PART 2 : rendering DOM elements
    );
}
export default Home;
```

1. Defining state hook for `currentId` with initial value: `null`
2. Using **useEffect** hook
    - dispatching fetched posts (using `getPosts()` method from actions/posts.js)
    - only re-run the effect if `currentId` has changed, or ~~dispatch change (why would it change?)~~ **React guarantees the dispatch function to be constant throughout the component lifetime, but we can still specify it.**

        To understand the logic behind this useEffect we need to dive in the dispatched function

        ```jsx
        export const getPosts = () => async(dispatch) => {
            try {
                const { data } = await api.fetchPosts();  
                return dispatch({type: FETCH_ALL, payload: data});
            } catch (error) {
                console.log(error.message);
            }
        }
        ```

        - using redux (**TS:** **where exactly?**) to patch or dispatch an action from the data from our backend
            1. fetching data from the backend with an asynchronous api.fetchPosts() method.
            2. returning dispatch with the type FETCH_ALL and the fetched data as payload

        The reducer in *reducers/posts.js :*

        ```jsx
        export default (posts = [], action) => {
            switch (action.type) {
                case FETCH_ALL:
                    return action.payload;
        				case ...
        ```

        - returning only the payload.

***PART 2: rendering DOM elements***

```jsx
        <Grow in>
        <Container>
            <Grid container justify="space-between" alignItems="stretch" spacing={3}>
                <Grid item xs={12} sm={7}>
                    <Posts setCurrentId={setCurrentId}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Form currentId={currentId} setCurrentId={setCurrentId}/>
                </Grid>
            </Grid>
        </Container>
    </Grow>
```

1. Using the following material-ui components:
    - **Grow** - a single child component, props:
        - ***in*** - if true, show the component; triggers the enter or exit animation.
    - **Container** - centers the content horizontally
    - **Grid** - adapts to screen size and orientation, ensuring consistency across layouts.
        - ***container*/*item*** - two types of a grid
        - ***spacing***
            - the responsive grid focuses on consistent spacing widths, rather than column width
            - from 0 to 10, where each integer is 8px.
        - ***alignItems*** - ***stretch*** stretches cells from the top to the bottom
        - ***justify* - *space-between***
2. Sending the `currentId` as argument to the Posts and Form components functions.

### components/Posts.js

```jsx
import React from 'react';
import { Grid, CircularProgress } from '@material-ui/core';
import { useSelector } from 'react-redux';

import Post from './Post/Post';

import useStyles from './styles';

const Posts = ({currentId, setCurrentId}) => {
    const posts = useSelector((state) => state.posts )
    const classes = useStyles();

		console.log(posts);

    return (
        //CircularProgress - loading spinner
        !posts.length ? < CircularProgress /> : (
            <Grid className={classes.actionDiv.container} container alignItems="stretch" spacing={3}>
                 {posts.map((post) => (
                     <Grid key={post._id} item xs={12} sm={6}>
                        <Post post={post} setCurrentId={setCurrentId}/>
                    </Grid>
                 ))}
            </Grid>
        )
    );
}

export default Posts;
```

to read: use selector: [https://react-redux.js.org/api/hooks](https://react-redux.js.org/api/hooks)

### TO DO:

1. Change the rendering method for <Route> in ReactRouter to use children elements, as the ReactRouter v5 docs recommends.
2. Study the differences in react state flow with and without redux.
