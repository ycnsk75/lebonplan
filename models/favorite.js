var mongoose=require('mongoose');

var schema=require("./schemas").Favorite;

var FavoriteSchema=new mongoose.Schema(schema);

var Favorite=mongoose.model("favorites",FavoriteSchema);

module.exports = Favorite;