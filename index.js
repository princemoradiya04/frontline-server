import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import FormModel from "./src/models/formModel.js";
import bwipjs from "bwip-js";

// config .env
dotenv.config();

const port = process.env.PORT || 5000;
const dbUri = process.env.DB_URI;
const app = express();

app.use(
  cors({
    origin: ["https://frontline-client-two.vercel.app", "http://localhost:5173"],
  })
);
app.use(express.json());


app.post("/api/v1/submit-form", async (req, res) => {
  try {
    const newForm = new FormModel(req.body);

    const redirectUrl = `${process.env.FRONTEND_URL}/form-details/${newForm._id}?qr=true`;
    const pngBuffer = await bwipjs.toBuffer({
      bcid: "qrcode",
      text: redirectUrl,
      scale: 2,
      includetext: false,
      textxalign: "center",
    });

    const barcodeBase64 = `data:image/png;base64,${pngBuffer.toString(
      "base64"
    )}`;
    newForm.barcode = barcodeBase64;

    await newForm.save();

    res
      .status(201)
      .json({ message: "Form data saved successfully!", form: newForm });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(400)
      .json({ message: "Error saving form data", error: errorMessage });
  }
});

app.put("/api/v1/forms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove _id from updateData if present to avoid MongoDB error
    delete updateData._id;

    // Validate required fields
    const requiredFields = [
      "areticalNo",
      "name",
      "date",
      "warpDetails",
      "weftDetails",
      "dyingMillName",
      "fabricsShortage",
      "barcode",
    ];
    const missingFields = requiredFields.filter(
      (field) => updateData[field] === undefined
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    const updatedForm = await FormModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.status(200).json({
      message: "Form updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      message: "Error updating form",
      error: errorMessage,
    });
  }
});

app.put("/api/v1/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { warpRate, weftRate } = req.body;

    const updateFields = {};
    if (warpRate !== undefined) updateFields.warpRate = warpRate;
    if (weftRate !== undefined) updateFields.weftRate = weftRate;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updatedForm = await FormModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ message: "Form not found" });
    }

    res
      .status(200)
      .json({ message: "Form updated successfully", data: updatedForm });
  } catch {
    res
      .status(500)
      .json({ message: "Error fetching form history", error: errorMessage });
  }
});

app.get("/api/v1/forms", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 30;
    const skip = (page - 1) * limit;

    const forms = await FormModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalForms = await FormModel.countDocuments();
    const totalPages = Math.ceil(totalForms / limit);

    res.status(200).json({ forms, page, totalPages });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error fetching form history", error: errorMessage });
  }
});

app.get("/api/v1/forms/:id", async (req, res) => {
  try {
    const form = await FormModel.findById(req.params.id);
    if (!form) {
      res.status(404).json({ message: "Form not found" });
    } else {
      res.status(200).json(form);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error fetching form details", error: errorMessage });
  }
});

app.get("/api/v1/form/:id", async (req, res) => {
  try {
    const form = await FormModel.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.status(200).json({
      message: "Form retrieved successfully",
      data: form,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      message: "Error fetching form",
      error: errorMessage,
    });
  }
});

app.delete("/api/v1/forms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedForm = await FormModel.findByIdAndDelete(id);

    if (!deletedForm) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.status(200).json({ message: "Form deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      message: "Error deleting form",
      error: errorMessage,
    });
  }
});

app.listen(port);

connectDB(dbUri);
