import mongoose from "mongoose";

const PlaneSchema = new mongoose.Schema(
  {
    Planename: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    commissionRate: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("plane", PlaneSchema);
