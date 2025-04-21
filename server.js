import mongoose from "mongoose";
import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import ConnectDB from "./Config/db.js";
import cors from "cors";
import UserRoute from "./Route/UserRoute.js";
import PlaneRoute from "./Route/PlaneRoute.js";
import DepositeRoute from "./Route/DepositeRoute.js";
import DepositAccounteRoute from "./Route/DepositeAccountRoute.js";
import CashOutRoute from "./Route/CashOutRoute.js";
import AdvanceRoute from "./Route/AdvanceRoute.js";

const app = express();

dotenv.config();

// 👇 Yeh line call honi chahiye thi!
ConnectDB();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/users", UserRoute);
app.use("/api/v1/plane", PlaneRoute);
app.use("/api/v1/deposite", DepositeRoute);
app.use("/api/v1/depositeaccount", DepositAccounteRoute);
app.use("/api/v1/cashout", CashOutRoute);
app.use("/api/v1/advance", AdvanceRoute);

app.get("/", (req, res) => {
  res.send("Welcome to web");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
