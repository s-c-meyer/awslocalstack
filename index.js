const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const Models = require('./models.js');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const app = express();

//necessary imports from AWS S3
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

//necessary imports for uploading files to an S3 bucket
const fs = require('fs');
const fileUpload = require('express-fileupload')

app.use(fileUpload()); //required to use express-fileupload


 
//connecting local db
mongoose.connect('mongodb://127.0.0.1:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true }); 


//connecting cloud mongo using heroku
// mongoose.connect(process.env.CONNECTION_URI, 
//                  { useNewUrlParser: true, 
//                  useUnifiedTopology: true }); 
                
//for connecting to mongoDB
const Movies = Models.Movie;
const Users = Models.User;

//serving static content
app.use(express.static('public'));

//logging using morgan 
app.use(morgan('common'));

//error handling
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

//for allowing app access from by others 
const allowedOrigins = ['http://localhost:8080', 'https://my-flix-movie-api.herokuapp.com/', 'http://localhost:1234', 'https://myflix-react-app.netlify.app'];
app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            //if specified origin isn't found on the list of allowed origins
            let message = `The CORS policy for this application doesn't allow access from origin ${origin}`;
            return callback(new Error(message), false); 
        }
        return callback(null, true);
    }
}));

//auth module requires body parser
const passport = require('passport');
app.use(passport.initialize())
let auth = require('./auth')(app);
require('./passport');

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error has occured!');
})

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(`Listening on Port ${port}`);
})

//Instantiate a client object from the S3Client class (here is where you would also pass in AWS Access Key and Passwords)
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  forcePathStyle: true
});

//Instantiate a command from the ListObjectsV2Command class
let listObjectParams = {
  Bucket: 'exercise-bucket-2-4'
};

listObjectsCmd = new ListObjectsV2Command(listObjectParams);

//gets a list of objects from a specific S3 bucket 
app.get('/images', (req, res) => {
  listObjectParams = {
    Bucket: 'exercise-bucket-2-4'
  }
  s3Client.send(new ListObjectsV2Command(listObjectParams)) //.send will execute the command
    .then((listObjectsResponse) => {
      res.send(listObjectsResponse)
    })
});

//uploads an image to a specific S3 Bucket
app.post('/imagesupload', async (req, res) => {
  const file = req.files.file //does not work with req.files.image
  const fileName = req.files.file.name //does not work with req.files.image.name

  const bucketParams = {
    Bucket: 'exercise-bucket-2-4',
    Key: fileName,
    Body: file.data,
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(bucketParams));
    res.send(data)
  } catch (err) {
    console.log("Error", err);
    res.status(500).send('Error uploading file to S3 Bucket');
  }
});

app.get('/images/:filename', async (req, res) => {
  const fileName = req.params.filename;

  const getObjectParams = {
    Bucket: 'exercise-bucket-2-4',
    Key: fileName,
  };

  try {
    const { Body, ContentType } = await s3Client.send(new GetObjectCommand(getObjectParams));

    res.setHeader('Content-disposition', `attachment; filename=${fileName}`); //this causes the browser to prompt a download, and identifies the file as an attachment to be downloaded, with the filename from the S3 bucket
    res.setHeader('Content-type', ContentType || 'application/octet-stream');

    Body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(404).send('File not Found');
  }
});



// app.get('/images/:ImageID', async (req, res) => {

//   const downloadParams = {
//     Bucket: 'exercise-bucket-2-4',
//     Key: req.params.ImageID
//   };

//   try {
//     console.log(ImageID);
//     const data = await s3Client.send(new GetObjectCommand(downloadParams));
//     const downloadPath = "downloaded-image.jpg";
//     const fileStream = fs.createWriteStream(downloadPath);
//     data.Body.pipe(fileStream);
//     console.log('File Downloaded Successfully', ImageID);
//   } catch (err) {
//     console.error('Error', err);
//   }
// });

//API endpoints start
app.get('/', (req, res) => {
    res.send("Welcome to myFlix api!!!!");
});

// Return a list of ALL movies to the user
//commented for frontend exercise
app.get('/movies', passport.authenticate('jwt', { session: false }),  (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies)
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});

// Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title to the user
app.get('/movies/:Title', passport.authenticate('jwt',{ session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title})
        .then((movie)=>{
            res.status(200).json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});

// Return data about a genre (description) by name/title (e.g., “Thriller”)
app.get('/movies/genre/:Name', passport.authenticate('jwt',{ session: false }), (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.Name})
    .then((genre)=>{
        res.status(200).json(genre);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
    });
});

// Return data about a director (bio, birth year, death year) by name
app.get('/movies/directors/:Name', passport.authenticate('jwt',{ session: false }), (req, res) => {
    Movies.findOne({ "Director.Name": req.params.Name})
    .then((director)=>{
        res.status(200).json(director);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
    });
});

// Allow new users to register
app.post('/users', 
        [
            check('Username', 'Username is required').not().isEmpty(),
            check('Username', 'Username must contain atleast 5 characters').isLength({min: 5}),
            check('Username', 'Username must contain alphanumeric characters').isAlphanumeric(),
            check('Password', 'Password is required').not().isEmpty(),
            check('Email', 'Email is not valid').isEmail(),
        ], 
        (req, res) => {
            let errors = validationResult(req);

            if(!errors.isEmpty()){
                return res.status(422).json({errors: errors.array()});
            }

            const { Username, Password, Email, Birthday } = req.body;
            const hashedPassword = Users.hashPassword(Password);

            // Search to see if a user with the requested username already exists
            Users.findOne({Username: Username})
            .then((user) => {
                //If the user is found, send a response that it already exists
                if(user) {
                    return res.status(400).send(`${Username} already exists`);
                }else{
                    Users.create({
                        Username,
                        Password: hashedPassword,
                        Email,
                        Birthday
                    })
                    .then((user) => {
                        res.status(201).json(user);
                    })
                    .catch((err) => {
                        console.error(err);
                        res.status(500).send(`Error: ${err}`);
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send(`Error: ${err}`);
            });
        });

// Allow users to udpdate their user info (username)
app.put('/users/:Username',
        passport.authenticate('jwt', { session: false }), 
        [
            check('Username', 'Username is required').not().isEmpty(),
            check('Username', 'Username must contain atleast 5 characters').isLength({min: 5}),
            check('Username', 'Username must contain alphanumeric characters').isAlphanumeric(),
            check('Password', 'Password is required').not().isEmpty(),
            check('Password', 'Password must contain atleast 5 characters').isLength({min: 5}),
            check('Email', 'Email is not valid').isEmail(),
        ], 
        (req, res) => {
            let errors = validationResult(req);

            if(!errors.isEmpty()){
                return res.status(422).json({errors: errors.array()});
            }

            const { Username, Password, Email, Birthday } = req.body;
            const hashedPassword = Users.hashPassword(Password);

            Users.findOneAndUpdate(
                {Username : req.params.Username},
                {
                    $set: { 
                        Username,
                        Password : hashedPassword,
                        Email,
                        Birthday
                    }
                },
                { new: true },
                (err, updatedUser) => {
                    if(err){
                        console.error(err);
                        res.status(500).send(`Error: ${err}`);
                    }
                    else{
                        res.status(200).json(updatedUser);
                    }
                }
            );
        });

// Allow users to add a movie to their list of favorites (showing only a text that a movie has been added—more on this later)
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    const {Username, MovieID} = req.params;

    Users.findOneAndUpdate(
        { Username },
        {
            $push: { FavoriteMovies: MovieID }
        },
        { new: true },
        (err, updatedUser) => {
            if(err){
                console.error(err);
                res.status(500).send(`Error: ${err}`);
            }
            else{
                res.status(200).json(updatedUser);
            }
        }
    );
});

// Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed—more on this later)
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    const {Username, MovieID} = req.params;

    Users.findOneAndUpdate(
        { Username },
        {
            $pull: { FavoriteMovies: MovieID }
        },
        { new: true },
        (err, updatedUser) => {
            if(err){
                console.error(err);
                res.status(500).send(`Error: ${err}`);
            }
            else{
                res.status(200).json(updatedUser);
            }
        }
    );
});

// Allow existing users to deregister (showing only a text that a user email has been removed—more on this later)
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { Username } = req.params;

    Users.findOneAndRemove({Username: Username})
    .then((user) => {
        if(!user){
            res.status(400).send(`${Username} was not found`);
        }else{
            res.status(200).send(`${Username} was deleted.`);
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
    });
});

app.listen(8080, () => {
    console.log('Server started on port 8080');
});