const express = require("express");
const userRouter = express.Router();

const userController = require("../controllers/userController");

// Route pour enregistrer un nouvel utilisateur
userRouter.post("/signup", userController.registerUser);

// Route pour authentifier un utilisateur
userRouter.post("/login", userController.authenticateUser);

module.exports = userRouter;
