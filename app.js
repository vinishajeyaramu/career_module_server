import express from "express"; 
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import authRouter from "./router/authRoutes.js";
import candidatesRouter from "./router/candidatesRoutes.js";
import router from "./router/router.js";
import pg from "pg";

dotenv.config({ path: "./config/.env" });

const { Pool } = pg;
const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.send(result.rows[0]);
});

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use("/auth", authRouter);
app.use("/candidates", candidatesRouter);
app.use("/api/v1", router);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

