const express = require("express");
const bookRouter = express.Router();

const authenticate = require("../middleware/auth");
const { uploadImage, resizeImage } = require("../middleware/multer-config");
const bookController = require("../controllers/bookController");

// Récupérer la liste de tous les livres
bookRouter.get("/", bookController.fetchAllBooks);

// Récupérer les livres avec les meilleures notes
bookRouter.get("/bestrating", bookController.fetchTopRatedBooks);

// Obtenir les détails d'un livre spécifique
bookRouter.get("/:id", bookController.fetchBookById);

// Ajouter un nouveau livre
bookRouter.post("/", authenticate, uploadImage, resizeImage, bookController.addNewBook);

// Modifier un livre existant
bookRouter.put("/:id", authenticate, uploadImage, resizeImage, bookController.modifyBook);

// Supprimer un livre
bookRouter.delete("/:id", authenticate, bookController.removeBook);

// Noter un livre
bookRouter.post("/:id/rating", authenticate, bookController.rateBook);

module.exports = bookRouter;
