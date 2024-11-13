// app.js
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");

const bookRoutes = require("./routes/bookRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Connexion à MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connexion à MongoDB réussie !"))
.catch((error) => console.log("Connexion à MongoDB échouée !", error));

// Traitement des requêtes JSON
app.use(express.json());

// Configuration des en-têtes CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    next();
});

// Servir la page de connexion statique sur /Connexion
app.get('/Connexion', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'connexion.html'));
});

// Routes de l'API
app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));

// Servir l'application React pour toutes les autres routes
app.use(express.static(path.join(__dirname, "frontend", "build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
});

module.exports = app;




