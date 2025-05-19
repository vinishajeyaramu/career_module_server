import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import client from "../config/connectdatabase.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "./uploads";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).fields([
  { name: "resume", maxCount: 1 },
  { name: "cover_letter", maxCount: 1 },
]);

// GET Single Data
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "SELECT * FROM candidates WHERE id = $1",
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).send("Candidate not found");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
  }
});

// Check if email exists
router.get("/check-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const result = await client.query(
      "SELECT * FROM candidates WHERE email = $1",
      [email]
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (error) {
    console.error("Email check error:", error);
    res.status(500).json({ error: "Server error checking email" });
  }
});

// POST: Add a candidate
router.post(
  "/",
  upload,
  async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        phone,
        linkedin,
        website,
        job_id,
        job_title,
      } = req.body;

      // Handle both resume and cover letter
      const resume = req.files["resume"] ? req.files["resume"][0].filename : null;
      const cover_letter = req.files["cover_letter"] ? req.files["cover_letter"][0].filename : null;

      // Check if resume exists as it's required
      if (!resume) {
        return res.status(400).json({ error: "Resume is required" });
      }

      const result = await client.query(
        "INSERT INTO candidates (first_name, last_name, email, phone, linkedin, website, resume, cover_letter, job_id, job_title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
        [
          first_name,
          last_name,
          email,
          phone,
          linkedin,
          website,
          resume,
          cover_letter,
          job_id,
          job_title,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        error: error.message,
        details: "Error uploading files or saving to database" 
      });
    }
  }
);

// GET: Fetch all candidates
router.get("/", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM candidates");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// DELETE: Remove a candidate
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "DELETE FROM candidates WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Candidate not found");
    }

    res.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// UPDATE: Update candidate information
router.put(
  "/:id",
  upload,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        email,
        phone,
        linkedin,
        website,
        job_id,
        job_title,
      } = req.body;

      const existingCandidate = await client.query(
        "SELECT * FROM candidates WHERE id = $1",
        [id]
      );

      if (existingCandidate.rows.length === 0) {
        return res.status(404).send("Candidate not found");
      }

      const resume = req.files["resume"]
        ? req.files["resume"][0].filename
        : existingCandidate.rows[0].resume;

      const result = await client.query(
        "UPDATE candidates SET first_name=$1, last_name=$2, email=$3, phone=$4, linkedin=$5, website=$6, resume=$7, job_id=$8, job_title=$9 WHERE id=$10 RETURNING *",
        [
          first_name,
          last_name,
          email,
          phone,
          linkedin,
          website,
          resume,
          job_id,
          job_title,
          id,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  }
);

export default router;