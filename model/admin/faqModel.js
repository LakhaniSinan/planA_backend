import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },

    status: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "faq",
  }
);

faqSchema.pre("save", async function (next) {
  if (this.isNew) {
    const maxOrderDoc = await this.constructor.findOne().sort({ order: -1 });
    this.order = maxOrderDoc ? maxOrderDoc.order + 1 : 0;
  }
  next();
});

export default mongoose.model("FAQ", faqSchema);
