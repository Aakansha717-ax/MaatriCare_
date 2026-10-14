
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "MaatriCare backend is running!",
        status: "success"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        service: "MaatriCare API",
        timestamp: new Date().toISOString()
    });
});

app.post("/api/sensor-readings", (req, res) => {
    const { heartRate, spo2, source } = req.body;

    if (
        typeof heartRate !== "number" ||
        typeof spo2 !== "number" ||
        !Number.isFinite(heartRate) ||
        !Number.isFinite(spo2) ||
        heartRate < 0 || heartRate > 300 ||
        spo2 < 0 || spo2 > 100
    ) {
        return res.status(400).json({
            error: "Invalid sensor readings"
        });
    }

    // Temporary prototype response.
    // Database storage will be added next.
    res.status(201).json({
        message: "Reading received",
        data: {
            heartRate,
            spo2,
            source: source || "prototype",
            receivedAt: new Date().toISOString()
        },
        note: "Values are not medically validated."
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`MaatriCare API running at http://localhost:${PORT}`);
});
