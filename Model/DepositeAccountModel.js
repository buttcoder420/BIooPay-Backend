import mongoose from "mongoose";
const depositAccountSchema = new mongoose.Schema(
  {
    account: {
      type: String,
      require: true,
    },

    accountNumber: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("depositeaccount", depositAccountSchema);
