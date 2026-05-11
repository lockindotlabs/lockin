import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express API!" });
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
