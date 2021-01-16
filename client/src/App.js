import React from 'react';
import { Container, AppBar, Grow, Grid, Typography } from '@material-ui/core';

import Posts from './components/Posts/Posts';
import Form from './components/Form/Form';
import thefacebook from './images/thefacebook.png';
import useStyles from './styles';

const App = () => {
    const classes = useStyles();
    return (
        <Container maxWidth="lg">
            <AppBar className={classes.AppBar} position="static" color="inherit">
                <Typography className={classes.heading} variant="h2" align="center">thefacebook</Typography>
            </AppBar>
            <Grow in>
                <Container>
                    <Grid container justify="space-between" alignItems="stretch" spacing={3}>
                        <Grid item xs={12} sm={7}>
                            <Posts />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Form />
                        </Grid>
                    </Grid>
                </Container>
            </Grow>


        </Container>
    );
}

export default App;