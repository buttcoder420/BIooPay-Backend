import mongoose from "mongoose";

const advancePromotionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamSizeAtApplication: {
      type: Number,
      required: true,
    },
    teamCategory: {
      type: String,
      enum: ["1-20", "21-50", "51-100", "100+"],
      required: true,
    },
    calculatedAdvanceAmount: {
      type: Number,
      // ❗ NOT required anymore, because it will be auto-calculated in pre-save
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    userComment: {
      type: String,
      default: "",
    },
    defaultNote: {
      type: String,
      default:
        "For apply advance you must have more than 2 to 3 active referral otherwise you are not eligible.",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Auto-set calculatedAdvanceAmount based on team category
advancePromotionSchema.pre("save", function (next) {
  switch (this.teamCategory) {
    case "1-20":
      this.calculatedAdvanceAmount = 4;
      break;
    case "21-50":
      this.calculatedAdvanceAmount = 10;
      break;
    case "51-100":
      this.calculatedAdvanceAmount = 30;
      break;
    case "100+":
      this.calculatedAdvanceAmount = 50;
      break;
    default:
      this.calculatedAdvanceAmount = 0;
  }
  next();
});

const AdvanceModel = mongoose.model("Advance", advancePromotionSchema);
export default AdvanceModel;
