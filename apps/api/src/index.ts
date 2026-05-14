import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.router.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express API!" });
});

app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
