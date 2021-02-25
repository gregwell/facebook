# The Facebook - detailed analysis

**Created:** 16.01.2021, **last updated:** 22.02.2021

- [Motivation](#motivation)
- [Linked notes](#linked-notes)
- [The original structure of the project](#the-original-structure-of-the-project)
- [Server side](#server-side)
- [Client side](#client-side)
- [Redux data flow mind map](#redux-data-flow-mind-map)  

# Motivation

The main purpose of this self-development project is to give me an overview of a typical React-powered project and let me see how *the real development process* looks like from scratch. The project uses MERN stack technologies (MongoDB, Express, React, Node.js)

I've followed line by line Adrian Hajdin's [tutorial code](https://github.com/adrianhajdin/project_mern_memories), then googled "what is *everything* used for?", opened countless amounts of stackoverflow questions and took notes. This README file shows my way of thinking **how things are done.**

# Linked notes
- [Javascript](https://github.com/gregwell/university-notes/blob/main/english/javascript/javascript.md)
- [React](https://github.com/gregwell/university-notes/blob/main/english/javascript/react.md)

# The original structure of the project

![https://raw.githubusercontent.com/gregwell/the-facebook/master/images/project_structure.png](https://raw.githubusercontent.com/gregwell/the-facebook/master/images/project_structure.png)

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
    - **AppBar -** displays information and actions relating to the current screen
    - **Typography -**  used to present the design and the content as clearly as possible
        - Why Typography? ****Too many type sizes and styles at once can spoil any layout. A typographic scale has a limited set of type sizes that work well together along with the layout grid.
    - **Toolbar -** is a wrapper where you can place elements in a horizontal line (like a tool bet)
2. Using **div** component for styling.
3. Using ReactRouter **Link** to navigate to "/" (home) of application inside Typography component. 
4. If user is logged in:
    1. Displaying image avatar or letter avatar if the image doesn't exist.
        - image avatar - by specifying alt=name and src=photoSrc
        - letter avatar - by passing a string as `children` + adding styling class
    2. Printing user name as `{user.result.name}`
    3. Displaying a logout button
        - **contained** - contained buttons are high-emphasis, distinguished by their use of elevation and fill; contain actions that are primary for application to work.
        - **onClick** - executing `logout` function
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

## components/Posts.js

***PART 1:***

```jsx
import React from 'react';
import { Grid, CircularProgress } from '@material-ui/core';
import { useSelector } from 'react-redux';
import Post from './Post/Post';
import useStyles from './styles';

const Posts = ({currentId, setCurrentId}) => {
    const posts = useSelector((state) => state.posts)
    const classes = useStyles();

		console.log(posts);

    return (
					//PART 2: rendering DOM elements
    );
}

export default Posts;
```

1. Posts function component receive `currentId` and `setCurrentId` as props.
2. Using `useSelector` to get the entire Redux store state as a parameter and return only the posts state.

***PART 2: rendering DOM elements***

```jsx
!posts.length ? < CircularProgress /> : (
	 <Grid className={classes.actionDiv.container} container alignItems="stretch" spacing={3}>
     {posts.map((post) => (
        <Grid key={post._id} item xs={12} sm={6}>
           <Post post={post} setCurrentId={setCurrentId}/>
        </Grid>
      ))}
   </Grid>
)
```

1. If the posts doesn't consist of any posts yet printing the `CircularProgress` material-ui component.
2. Iterating through each post in `posts` and rendering for it a distinct **Grid** component with the **key**  equal to `post._id`. 
3. Inside this **Grid** rendering the post itself (the logic and DOM structure from **post.js** file)

## components/Post.js

***PART 1:***

```jsx
import React from 'react';
import {Card, CardActions, CardContent, CardMedia, Button, Typography} from '@material-ui/core';
import ThumbUpAltIcon from '@material-ui/icons/ThumbUpAlt';
import ThumbUpAltOutlined from '@material-ui/icons/ThumbUpAltOutlined';
import DeleteIcon from '@material-ui/icons/Delete';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import moment from 'moment';
import useStyles from './styles';
import { useDispatch } from 'react-redux';

import {deletePost, likePost} from '../../../actions/posts';

const Post = ({ post, setCurrentId }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const user = JSON.parse(localStorage.getItem('profile'));

    const Likes = () => {
        if (post.likes.length > 0) {
          return post.likes.find((like) => like === (user?.result?.googleId || user?.result?._id))
            ? (
              <><ThumbUpAltIcon fontSize="small" />&nbsp;{post.likes.length > 2 ? `You and ${post.likes.length - 1} others` : `${post.likes.length} like${post.likes.length > 1 ? 's' : ''}` }</>
            ) : (
              <><ThumbUpAltOutlined fontSize="small" />&nbsp;{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</>
            );
        }
    
        return <><ThumbUpAltOutlined fontSize="small" />&nbsp;Like</>;
      };

    return (
       //PART 2: rendering DOM elements
    );
}

export default Post;
```

1. Parsing user profile from local storage and assigning it to a const.
2. Defining the function to handle showing likes - this function works as separate React component.
    - If `post.likes` array is not empty (this array consists of ids users who likes this post):
        - If the id of current user is in the `post.likes` array:
            - using **ThumbUpAltIcon** to show appropriate string who liked the post
        - If the id of current user isn't in `post.likes` array
            - using **ThumbUpAltOutlined** to show anyway who liked the post
    - if the `post.likes` array is empty then simply showing *Like*.

***PART 2: rendering DOM elements***

```jsx
 <Card className = {classes.card}>
            <CardMedia className = {classes.media} image={post.selectedFile} title={post.title} />
            <div className={classes.overlay}>
                <Typography variant="h6">{post.name}</Typography>
                <Typography variant="body2">{moment(post.createdAt).fromNow()}</Typography>
            </div>
            {(user?.result?.googleId === post?.creator || user?.result?._id === post?.creator ) && (
                <div className={classes.overlay2}>
                <Button style={{color: 'white'}} size="small" onClick={() => setCurrentId(post._id)}> 
                    <MoreHorizIcon fontSize="default" />
                </Button>
            </div>
            )}
            <div className={classes.details}>
                <Typography variant="body2" color="textSecondary">{post.tags.map((tag)=> `#${tag} `)}</Typography>
            </div>
            <Typography className={classes.title} variant="h5" gutterBottom> {post.title} </Typography>
            <CardContent>
                <Typography variant="body2" color="textSecondary" component="p"> {post.message} </Typography>
            </CardContent>
            <CardActions className={classes.cardActions}>
                <Button size="small" color="primary" disabled={!user?.result} onClick={() =>dispatch(likePost(post._id)) }>
                    <Likes />
                </Button>
                {(user?.result?.googleId === post?.creator || user?.result?._id === post?.creator ) && (
                    <Button size="small" color="primary" onClick={() => dispatch(deletePost(post._id)) }>
                        <DeleteIcon fontSize="small" /> Delete
                    </Button>
                )}
            </CardActions>
        </Card>
```

1. Using the following material-ui components:
    - **Card** - cards contain content and actions about a single subject.
    - **CardMedia** *image*: image to be displayed as a background image
    - **MoreHorizIcon -** three dots icon
    - **CardContent**
    - **CardActions**

2. Displaying background image with **CardMedia** component

3. Creating div with relevant styling and two **Typography** components inside. 

- the first one shows the post creator: `post.createdAt`
- the second one shows how long ago the post was created: `moment(post.createdAt).fromNow()`

4. If the user id fetched from the local storage (`googleId` or `_id`) is equal to the id of the post creator:

- showing the button with **no text inside**, but with a children: **MoreHorizIcon**
- onClick calls `setCurrentId` state setter function with the `post._id`.
- **IMPORTANT INFO regarding currentId state:**
    - the new state variable:  `const [currentId, setCurrentId] = useState(null);` is defined in **home.js.**
    - The state (`post._id`) that is set here can be used later just in the form. We expect being able to immediately edit the post data after clicking this button, so somehow the Form component gets the `currentId` that is in our case the currently edited post id.
    - This is because our state is set globally and each component can access it - **is this provided by Hooks or redux play any role here? [to answer later]**

5. Creating a **div** with a **Typography** component where for each post tag we print it separately preceded by hashtag `post.tags.map((tag)=> `#${tag} `)`.

6. Creating a **Typography** component to print the `post.title`.

7. Creating a **CardContent** component with a **Typography** as children for printing `post.message`.

8. Creating the button to like posts 

- the button is clickable only when someone is signed in thanks to disabled property: `disabled={!user?.result}`
- onClick runs a dispatch function with likePost function `dispatch(likePost(post._id)`
- the children of this button is our **Likes** component that deals with printing the relevant count of likes.

9.  If the user id fetched from the local storage (`googleId` or `_id`) is equal to the id of the post creator:

- creating Button dispatching **deletePost** action with the current post id.
- inside this button instead of text putting **DeleteIcon**

## components/Form.js

***PART 1:***

```jsx
import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Paper } from '@material-ui/core';
import FileBase from 'react-file-base64';
import {useDispatch, useSelector} from 'react-redux';
import useStyles from './styles';
import {createPost, updatePost} from '../../actions/posts' 

const Form = ({currentId, setCurrentId}) => {
    const [postData, setPostData] = useState({ title: '', message: '', tags: '', selectedFile: '' });
    const post = useSelector((state) => currentId ? state.posts.find((p) => p._id===currentId) : null);
    const classes = useStyles();
    const dispatch = useDispatch();
    const user = JSON.parse(localStorage.getItem('profile'));

    useEffect(() => {
        if(post) setPostData(post);
    }, [post] )

    const handleSubmit = (e) => {
        e.preventDefault();

        if(currentId) {
            dispatch(updatePost(currentId, {...postData, name:user?.result?.name }));
        } else {
            dispatch(createPost({...postData, name:user?.result?.name }));
        }
        clear();
    }

    if(!user?.result?.name) {
        return (
            <Paper className={classes.paper}>
                <Typography variant="h6" align="center">
                    Please sign in to create your own post or like others.
                </Typography>
            </Paper>
        )
    }

    const clear = () => {
        setCurrentId(null);
        setPostData({ title: '', message: '', tags: '', selectedFile: '' });
    }

    return (
				// **PART 2: rendering DOM elements**
    );
}  

export default Form;
```

1. The Form component takes currentId and setCurrentId as props
2. Defining postData state with useState hook.
3. Using `useSelector` to get the entire Redux store state as a parameter
    - if **currentId** state exists, then return the state of the post with the id of **currentId**
    - otherwise return null
4. Defining dispatch.
5. Defining user: getting user profile from local storage.
6. Using `useEffect` hook to populate the values of the form
    - the callback function run when **the post value changes from nothing to something**
7. handleSubmit function:
    - preventing default (**what is default?)**
    - if **currentId** exists, then dispatching an action: calling updatePost method from actions

    ```jsx
    export const updatePost = (id, post) => async (dispatch) => {
        try {
            const {data} = await api.updatePost(id,post);
            dispatch({type: UPDATE, payload: data});
        } catch (error) {
            console.log(error);
        }
    }
    ```

    - the updatePost method calls api.updatePost to get the updated post, then dispatching an action with `UPDATE` type
    - if **currentId** does not exist, then dispatching an action to createPost: calling createPost methods from actions
    - clearing the form data (external function: calling **setCurrentId = null** and **setPostData** to contain nothing.
8. If there is no `user?.result?.name` returning **Paper** component with a **Typography** informing that only logged users can create or like posts.

***PART 2: rendering DOM elements***

```jsx
<Paper className = { classes.paper} >
    <form autoComplete="off" noValidate className={`${classes.root} ${classes.form}`} onSubmit = {handleSubmit} >
      <Typography variant="h6">{currentId ? 'Editing' : 'Creating'} a post</Typography>
      <TextField  name="title" variant="outlined" label ="Title" fullWidth value={postData.title} onChange={(e) => setPostData({...postData, title: e.target.value})}/>
      <TextField  name="message" variant="outlined" label ="Message" fullWidth value={postData.message} onChange={(e) => setPostData({...postData, message: e.target.value})}/>
      <TextField  name="tags" variant="outlined" label ="Tags" fullWidth value={postData.tags} onChange={(e) => setPostData({...postData, tags: e.target.value.split(',')})}/>
      <div className={classes.fileInput}> <FileBase type="file" multiple={false} onDone={({ base64 }) => setPostData({ ...postData, selectedFile: base64})}/></div>
      <Button className={classes.buttonSubmit} variant="contained" color="primary" size="large" type="submit" fullWidth>Submit</Button>
      <Button variant="contained" color="secondary" size="small" onClick={clear} fullWidth>Clear</Button>
    </form>
</Paper>
```

1. Using **Paper** material-ui component
    - **paper** component - the flat, opaque texture of a sheet of paper, an app's behavior mimics paper's ability to be re-sized, shuffled and bound together in multiple sheets.
2. Creating form with onSubmit function **handleSubmit**
3. Showing form description with **Typography** component.
    - if **currentId** (from Form component props) exists then showing *editing*, otherwise *Creating*
4. Showing three text fields, each of them onChange run setPostData method, spread all values and replace the one from this text field
5. Using **FileBase** component imported from *react-file-base64* to convert the requested image to base64
    - surrounding this component with a simple div for styling
    - when converting is done running setPostData, spreading all values and replacing *selectedFile.*
6. Using "submit" type button to allow submitting the form.
7. The last button allows for clearing the data, simply execute **onClick** function `clear`.

## components/Auth/Auth.js

***PART 1:***

```jsx
import React, { useState } from 'react'
import { Avatar, Button, Paper, Grid, Typography, Container } from '@material-ui/core';
import { GoogleLogin } from 'react-google-login';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import useStyles from './styles';
import Input from './Input';
import Icon from './icon';
import { signin, signup } from '../../actions/auth';

const initialState = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };

const Auth = () => {

    const classes = useStyles();
    const [showPassword, setShowPassword] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState(initialState);
    const dispatch = useDispatch();
    const history = useHistory();

    const handleShowPassword = ()  => setShowPassword((prevShowPassword) => !prevShowPassword); //toggling on/off

    const handleSubmit= (e) => {
        e.preventDefault();
        console.log(formData);

        if (isSignup) {
            dispatch(signup(formData, history)) 
        } else {
            dispatch(signin(formData, history)) 
        }
        
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value }) 
    }

    const switchMode = () => {
        setIsSignup((prevIsSignup) => !prevIsSignup);
        setShowPassword(false);
    }

    const googleSuccess = async (res) => {
        const result = res?.profileObj; // only . would give an error when we dont have res, ?. is error free, just say undefined if this is case
        const token = res?.tokenId;

        try {
            dispatch({ type: 'AUTH', data: { result, token } });
            history.push('/');

        } catch (error) {
            console.log(error);
        }
    }

    const googleFailure = (error) => {
        console.log(error);
        console.log('google sign in was unsuccesful. try again later');
    }

    return (
					//***PART 2: rendering DOM elements***
    )
}

export default Auth
```

1. Creating a bunch of new states: **showPassword, isSignup, formData** with some initial states: empty strings or false bools.
2. Defining history and dispatch hooks variables.
3. Defining a function to handle show password operation: 
    - `setShowPassword((prevShowPassword) => !prevShowPassword);` - toggling states from false to true and from true to false.
4. Defining a function to handle submit button
    - preventing default
    - if isSignup state is true then **dispatching a `signup`** function with `formData` and `history` as props (**what is history used for?)**
    - if isSignup state is false, then dispatching a `signin` function.
5. Defining a function to handle formData change 
    - using `setFormData` to change currently used values
6. Defining a function to handle toggling between sign up and sign in.
    - toggling states from false to true and from true to false.
    - setting `showPassword`state to false
7. Handling google login success:
    - obtaining user profile from `res?.profileObj`
    - obtaining user token `res?.tokenId`
    - dispatching an action type:'AUTH', data: {result, token})
    - pushing the homepage '/' to the history, so changing the rendered dom elements to these in Home.js file.
8. Handling google login error - logging an error.

***PART 2: rendering DOM elements***

```jsx
        <Container component="main" maxWidth="xs">
            <Paper className={classes.paper} elevation={3}>
                <Avatar className={classes.avatar}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography variant="h5">{isSignup ? 'Sign up' : 'Sign in'}</Typography>
                <form className={classes.form} onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        { isSignup && (
                        <>
                            <Input name="firstName" label="First Name" handleChange={handleChange} autoFocus half/>
                            <Input name="lastName" label="Last Name" handleChange={handleChange} autoFocus half/>
                        </>
                        )}
                        <Input name="email" label="Email Address" handleChange={handleChange} type="email"/>
                        <Input name="password" label="Password" handleChange={handleChange} type={showPassword ? "text" : "password"} handleShowPassword={handleShowPassword}/>
                        { isSignup && <Input name="confirmPassword" label="Repeat Password" handleChange={handleChange} type="password"/> }
                    </Grid>
                    <Button type="submit" fullWidth variant="contained" color="primary" className={classes.submit}>
                        {isSignup ? 'Sign Up' : 'Sign in'}
                    </Button>
                    <GoogleLogin
                        clientId="googleClientId-change it to env variable later!" 
                        render={(renderProps) => (
                            <Button className={classes.googleButton} color="primary" fullWidth onClick={renderProps.onClick} disabled={renderProps.disabled} startIcon={<Icon/>} variant="contained">
                                Google Sign In
                            </Button>
                        )}
                        onSuccess={googleSuccess}
                        onFailure={googleFailure}
                        cookiePolicy="single_host_origin"
                    />
                    <Grid container justify="flex-end">
                        <Grid item>
                            <Button onClick={switchMode}>
                                { isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
```

1. Creating a new container with a paper component inside.
2. Showing an icon corresponding the log in operation
3. Displaying *Sign up* or *Sign in* **Typography** depending on the isSignup state.
4. Creating a form with **onSubmit** method: `handleSubmit`
5. Creating **Grid** container
6. Depending on the isSignup state showing five(firstName, lastName, email, password, confirmPassword) Input components or only two: email and password when isSignup = false.
    - each Input component run handleChange method: `handleChange={handleChange}`
7. Creating **Grid** component with a **submit** type **Button** with a text dependent on isSignupState
8. Creating **GoogleLogin** component
    - pasting `clientId` from google developers website and assigning it to the variable
    - defining render method with `renderProps` this method renders the **Button** with**:**
        - `onClick: {renderProps.onClick}`
        - `disabled: {renderProps.disabled}`
        - `startIcon={<Icon/>}`
        - text inside: Google Sign In
    - calling **onSuccess** and **onFailure** external methods.
    - setting cookiePolicy: `cookiePolicy="single_host_origin"`
9. Creating a **Grid** container with a **Grid** item with **Button** as children. The button:
    - executes **onClick** function `switchMode`
    - shows different text depending on isSignup state

## components/Auth/input.js

```jsx
import React from 'react'
import { TextField, Grid, InputAdornment, IconButton } from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'

const Input = ({ name, handleChange, label, half, autoFocus, type, handleShowPassword}) => {
    return (
        <Grid item xs={12} sm={half ? 6 : 12} >
            <TextField
                name={name}
                onChange={handleChange}
                variant="outlined"
                required
                fullWidth
                label={label}
                autoFocus={autoFocus}
                type={type}
                InputProps={name === 'password' ? {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleShowPassword}>
                                {type === "password" ? <Visibility/> : <VisibilityOff/>}
                            </IconButton>
                        </InputAdornment>
                    )
                } : null}
            />
        </Grid>
    )
}

export default Input
```

1. Defining custom React component consisting of a **Grid** and a **TextField** components.
2. The component takes as props an array consisting of 7 variables.

## actions/posts.js

```jsx
import * as api from '../api';
import {FETCH_ALL, CREATE, UPDATE, DELETE} from '../constants/actionTypes';

export const getPosts = () => async(dispatch) => {

    try {
        //Using redux to patch or dispatch an action from the data from our backend
        //{data} because we get response from api and inside api we have an object
        const { data } = await api.fetchPosts();  
        return dispatch({type: FETCH_ALL, payload: data});
    } catch (error) {
        console.log(error.message);
    }

}

export const createPost = (post) => async (dispatch) => {
    try {
        const {data} = await api.createPost(post);
        dispatch({type: CREATE, payload: data});
    } catch (error) {
        console.log(error);
    }
}

export const updatePost = (id, post) => async (dispatch) => {
    try {
        const {data} = await api.updatePost(id,post);
        dispatch({type: UPDATE, payload: data});
    } catch (error) {
        console.log(error);
    }
}

export const deletePost = (id) => async (dispatch) => {
    try {
        await api.deletePost(id);
        dispatch({type: DELETE, payload: id});
    } catch (error) {
        console.log(error);
    }
}

export const likePost = (id) => async(dispatch) => {
    try {
        const {data} = await api.likePost(id);
        dispatch({type: UPDATE, payload: data});
    } catch (error) {
        console.log(error);
    }
}
```

- **Action Creators** - functions that returns actions
- **action** is just an object that has type and a payload
- **Redux thunk** allows us to in here specify an additional arrow function (we are dealing with asynchronous logic)
    - **redux-thunk** is a middleware that allows you to write action creators that return a function instead of an action
    - **the thunk** can be used to delay the dispatch of an action or to dispatch only if a certain conditon is met
    - is used mainly for **async calls to api**, that dispatch another action on success/failure

## Redux data flow mind map

- click to enlarge

![https://raw.githubusercontent.com/gregwell/the-facebook/master/images/redux-data-flow.png](https://raw.githubusercontent.com/gregwell/the-facebook/master/images/redux-data-flow.png)

### TO DO:

1. Change the rendering method for <Route> in ReactRouter to use children elements, as the ReactRouter v5 docs recommends.
2. Study the differences in react state flow with and without redux.
