# myFlixDB API

This is a backend "movie" application build using Node.js. This application will provide users with access to information about different movies, directors, and genres. Users will be able to sign up, update their personal information, and create list of their favorite movies.Authentication and authorization is implementated using JWT tokens.

## App Features 🚀

- Scalable design
- Security Middleware: cors, sessiontokens
- Security in controller: user permission levels, sanitization, data filtering
- In pattern Model-View-Controller this backend is easy to implement different Models

## Technology Used
* Javascript
* Node.js
* Express
* MongoDB

The app is deployed to Heroku. Read about all the features and relevant endpoints <a href="https://my-flix-movie-api.herokuapp.com/documentation.html">here.</a>

## API Reference 📋

| Action  | Method |  Query Parameters | Endpoint URL | Response
| ------------- | ------------- |------------- |------------- |------------- |
| Return a list of all movies | GET  | None passed (retrieve all) | '/movies'  |Returns a JSON array of all movies in the database |
| Return data about a single movie By TITLE  | GET  | Title  |	'/movies/:title' |  Returns a JSON object with data on a single movie based on the title passed in the url
| Return data about a single movie By GENRE  | GET  | Genre  |	'/movies/:genre/movies' |  Returns a JSON array of all movies in the database based on the genre passed in the url
| Return description BY GENRE  | GET  | Genre  |	'genres/:genre' |  Returns a JSON array of the genre passed in the url, and its description
| Return a list of movies BY DIRECTOR NAME  | GET  | Genre  |	'/directors/:director' |  Returns a JSON object containing all movies in the database by the name of the director name that was passed in the url
| Return a list of all users  | GET  | None passed (retrieve all)  |	'/users' |  	Returns a JSON object containing the list of all users in the database
| Return a data about a user by USER NAME  | GET  | Username  |	'/users/username' |  	Returns a JSON object containing the user based on the username passed in the URL
| Allow new user to register | POST  | JSON object with user data  |	'/users' |  Returns a JSON object containing data about the username added
| Allow users to update their user info BY USERNAME | PUT  | Username  |	'/users/Username' |  	JSON object with updated user data
| Allow users to add a movie to their list of favorite movies | POST  | Username, MovieID  |	'/users/:username/movies/:movieID'|  Returns a JSON object with updated user data.
| Allow users to remove a movie from their list of favorite movies | DELETE  | Username, MovieID  |	'/users/:username/movies/:movieID'|  Returns a JSON object with updated user data.
| Allow existing users to deregister| DELETE  | Username  |	'/users/:username'| Returns a text confirming that the user's email was deleted successfully.
| Return a list of all actors in the database| GET  | None passed (retrieve all)  |	'/actors'| Returns a JSON objects of all actors in the database
| Return data about an actor (bio, birth year, death year) by ACTOR NAME| GET  | Actor  |	'/actors/:actorName'| Returns a JSON objects with data on a the actor passed in the url