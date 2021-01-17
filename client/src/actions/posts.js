import * as api from '../api';


//Action Creators - functions that returns actions
//action is just an object that has type and a payload

//redux thunk allows us to in here specify an additional arrow function // 
//(we are dealing with asynchronous logic)
export const getPosts = () => async(dispatch) => {

    try {
        //Using redux to patch or dispatch an action from the data from our backend
        //{data} because we get response from api and inside api we have an object
        const { data } = await api.fetchPosts();  
        return dispatch({type: 'FETCH_ALL', payload: data});
    } catch (error) {
        console.log(error.message);
    }

}

export const createPost = (post) => async (dispatch) => {
    try {
        const {data} = await api.createPost(post);
        dispatch({type: 'CREATE', payload: data});
    } catch (error) {
        console.log(error);
    }
}