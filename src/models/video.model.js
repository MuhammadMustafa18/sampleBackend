import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema({
  title: {
    type: String,
    required: true,
    
  },
  description: {
    type: String,
    required: true,
    
  },
  duration: {
    type: Number,
    required: true,
    
  },
  view: {
    type: Number, // cloudinary
    default: 0,
  },
  isPublished: {
    type: Boolean, // cloudinary
    default: true,
  },
  owner:{
    type: Schema.Types.ObjectId,
    ref:"User"
  }

}, {timestamps: true}
);
videoSchema.plugin(mongooseAggregatePaginate) // karenge isay
export const Video = mongoose.model("Video",videoSchema)