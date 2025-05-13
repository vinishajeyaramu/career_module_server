import client from "../config/connectdatabase.js";
import multer from "multer";
import express from 'express';

const app = express()

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
const upload = multer({ storage });

app.post(
  "/upload",
  upload.single("resume"),  // Changed to single file upload
  (req, res) => {
    res.send("File uploaded successfully");
  }
);

// GET: Fetch a single candidate
export const getSingleCandidates = async (req, res) => {
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
  };

// POST: Add a candidate
export const addCandidates = [
    upload.single("resume"),  // Changed to single file upload
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

        const resume = req.file.filename;  // Changed to single file

        const result = await client.query(
          "INSERT INTO candidates (first_name, last_name, email, phone, linkedin, website, resume, job_id, job_title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
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
          ]
        );

        res.json(result.rows[0]);
      } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
      }
    }
];

// GET: Fetch all candidates
export const getAllCandidates = async (req, res) => {
    try {
      const result = await client.query("SELECT * FROM candidates");
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }

// DELETE: Remove a candidate
export const deleteCandidates = async (req, res) => {
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
  };

// UPDATE: Update candidate information
export const updateCandidates = [
    upload.single("resume"),  // Changed to single file upload
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

        const resume = req.file
          ? req.file.filename
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
];