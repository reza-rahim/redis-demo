var bcrypt = require('bcrypt-nodejs');
var Redis = require('../models/redis');
var redisClient = Redis.redisClient

var userSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true}
});

userSchema.methods.encryptPassword = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};
