import * as api from '../api';
import {FETCH_ALL, CREATE, UPDATE, DELETE} from '../constants/actionTypes';

//Action Creators - functions that returns actions
//action is just an object that has type and a payload

//redux thunk allows us to in here specify an additional arrow function // 
//(we are dealing with asynchronous logic)
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