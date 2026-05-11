import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import { errorBoundary } from "./middleware/errorBoundary.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Set up Swagger UI
setupSwagger(app);

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express API!" });
});

app.use("/api/users", userRoutes);

// Error handler (AFTER all routes)
app.use(errorBoundary);

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
