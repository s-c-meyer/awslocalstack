const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models');
const passportJWT = require('passport-jwt');

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

//HTTP authentication for login
passport.use( new LocalStrategy({
   usernameField: 'Username',
   passwordField: 'Password'
}, ( username, password, callback ) => {
    console.log(`Username: ${username}, Password: ${password}`);
    Users.findOne({ Username: username }, (error, user) => {
        if(error){
            console.log(error);
            return callback(error);
        }

        if(!user){
            console.log('Incorrect username');
            return callback( null, 
                             false, 
                             {message: 'Incorrect username.'});
        }

        if(!user.validatePassword(password)){
            console.log('Incorrect password');
            return callback(null, false, {message: 'Incorrect password.'});
        }

        console.log('Login was successful');
        return callback(null, user);
    })
}));

//JWT authentication
passport.use( new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'myFlix API secret key'
}, ( jwtPayload, callback ) => {
    return Users.findById(jwtPayload._id)
        .then((user) =>{
            return callback(null, user);
        })
        .catch((error) => {
            return callback(error);
        });
}));