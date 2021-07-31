var mongoose=require("mongoose");
//schema Setup
const campGroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    image_id: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    author:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String,
        createdAt: String
    },
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref :"Comment"
        }
    ],
});

module.exports = mongoose.model("Campground", campGroundSchema);