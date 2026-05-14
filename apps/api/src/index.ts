import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import { errorBoundary } from "./middleware/errorBoundary.js";
import { setupSwagger } from "./config/swagger.js";
import authRouter from "./modules/auth/auth.router.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

setupSwagger(app);

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express API!" });
});

app.use("/api/users", userRoutes);
app.use("/auth", authRouter);

app.use(errorBoundary);

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
