import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  checkoutId: String,
  xenditInvoiceId: String,
  status: { type: String, default: "PENDING" },
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);