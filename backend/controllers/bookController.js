const BookModel = require("../models/Book");
const fs = require("fs");

// Récupérer tous les livres
exports.fetchAllBooks = (req, res, next) => {
    BookModel.find()
        .then((bookList) => {
            if (bookList.length === 0) {
                return res.status(404).json({
                    message: "Aucun livre n'a été trouvé.",
                });
            }
            res.status(200).json(bookList);
        })
        .catch((err) => {
            res.status(500).json({
                message: "Erreur lors de la récupération des livres.",
                error: err,
            });
        });
};

// Obtenir les détails d'un livre spécifique
exports.fetchBookById = (req, res, next) => {
    const id = req.params.id;
    BookModel.findById(id)
        .then((book) => {
            if (!book) {
                return res.status(404).json({
                    message: "Le livre demandé est introuvable.",
                });
            }
            res.status(200).json(book);
        })
        .catch((err) => {
            res.status(500).json({
                message: "Erreur lors de la récupération du livre.",
                error: err,
            });
        });
};

// Récupérer les livres avec les meilleures notes
exports.fetchTopRatedBooks = (req, res, next) => {
    BookModel.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then((books) => {
            res.status(200).json(books);
        })
        .catch((err) => {
            res.status(500).json({
                message: "Erreur lors de la récupération des meilleurs livres.",
                error: err,
            });
        });
};

// Valider le format des entrées pour un livre
const validateBookInputs = (title, author, genre, year) => {
    const errorMessages = [];

    const titlePattern = /^[a-zA-Z0-9\sÀ-ÿ.,:;!?¿$¥€+/\-_'&@+" ]{3,200}$/;
    const textPattern = /^[a-zA-Z\sÀ-ÿ.,:;!?¿$¥€+/\-_'&@+" ]{3,50}$/;
    const yearPattern = /^\d{4}$/;

    if (title && !titlePattern.test(title)) {
        errorMessages.push("Le titre a un format invalide.");
    }

    if (author && !textPattern.test(author)) {
        errorMessages.push("Le format de l'auteur est invalide.");
    }

    if (year && !yearPattern.test(year)) {
        errorMessages.push("L'année doit être au format YYYY.");
    }

    if (genre && !textPattern.test(genre)) {
        errorMessages.push("Le genre a un format invalide.");
    }

    return errorMessages;
};

// Fonction utilitaire pour supprimer une image du serveur
const removeImageFile = (imagePath) => {
    try {
        fs.unlinkSync(imagePath);
    } catch (err) {
        console.error("Erreur lors de la suppression de l'image :", err);
    }
};

// Créer un nouveau livre
exports.addNewBook = async (req, res, next) => {
    try {
        const bookDetails = JSON.parse(req.body.book);

        delete bookDetails._id;
        delete bookDetails._userId;

        const { title, author, genre, year } = bookDetails;

        const cleanTitle = title.trim();
        const cleanAuthor = author.trim();
        const cleanGenre = genre.trim();
        const cleanYear = year.trim();

        const validationErrors = validateBookInputs(
            cleanTitle,
            cleanAuthor,
            cleanGenre,
            cleanYear
        );

        if (validationErrors.length > 0) {
            if (req.file) {
                removeImageFile(req.file.path);
            }
            return res.status(400).json({ message: validationErrors.join(" ") });
        }

        // Vérifier si le livre existe déjà
        const existingBook = await BookModel.findOne({
            title: cleanTitle,
            author: cleanAuthor,
        });

        if (existingBook) {
            if (req.file) {
                removeImageFile(req.file.path);
            }
            throw new Error("Ce livre est déjà enregistré.");
        }

        // Gérer le cas où la note est nulle
        if (
            bookDetails.ratings &&
            bookDetails.ratings.length === 1 &&
            bookDetails.ratings[0].grade === 0
        ) {
            bookDetails.ratings = [];
            bookDetails.averageRating = 0;
        }

        const newBook = new BookModel({
            ...bookDetails,
            title: cleanTitle,
            author: cleanAuthor,
            genre: cleanGenre,
            year: cleanYear,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
        });

        await newBook.save();

        res.status(201).json({
            message: "Le livre a été créé avec succès !",
        });
    } catch (err) {
        if (req.file) {
            removeImageFile(req.file.path);
        }
        res.status(400).json({
            error: err.message,
        });
    }
};

// Mettre à jour un livre existant
exports.modifyBook = async (req, res, next) => {
    let bookToUpdate;
    let previousImageUrl;
    try {
        const updatedData = req.file
            ? { ...JSON.parse(req.body.book) }
            : { ...req.body };
        delete updatedData._userId;

        bookToUpdate = await BookModel.findOne({ _id: req.params.id });

        if (!bookToUpdate) {
            return res.status(404).json({
                message: "Livre introuvable.",
            });
        }

        if (bookToUpdate.userId.toString() !== req.auth.userId) {
            return res.status(403).json({
                message: "Vous n'avez pas l'autorisation de modifier ce livre.",
            });
        }

        previousImageUrl = bookToUpdate.imageUrl;

        const { title, author, genre, year } = updatedData;

        const cleanTitle = title.trim();
        const cleanAuthor = author.trim();
        const cleanGenre = genre.trim();

        const validationErrors = validateBookInputs(
            cleanTitle,
            cleanAuthor,
            cleanGenre,
            year
        );
        if (validationErrors.length > 0) {
            throw new Error(`Erreurs de validation : ${validationErrors.join(" ")}`);
        }

        const oldImageName = bookToUpdate.imageUrl.split("/images/")[1];

        if (req.file) {
            const newImageUrl = `${req.protocol}://${req.get("host")}/images/${req.file.filename}`;
            bookToUpdate.imageUrl = newImageUrl;
        }

        await bookToUpdate.updateOne({
            title: cleanTitle,
            author: cleanAuthor,
            genre: cleanGenre,
            year: year,
            imageUrl: req.file ? bookToUpdate.imageUrl : previousImageUrl,
        });

        if (req.file) {
            removeImageFile(`images/${oldImageName}`);
        }

        res.status(200).json({
            message: "Le livre a été mis à jour avec succès !",
        });
    } catch (err) {
        if (req.file) {
            removeImageFile(req.file.path);
            try {
                await bookToUpdate.updateOne({ imageUrl: previousImageUrl });
            } catch (error) {
                console.error("Erreur lors de la restauration de l'image :", error);
            }
        }

        res.status(400).json({ error: err.message });
    }
};

// Supprimer un livre
exports.removeBook = (req, res, next) => {
    const bookId = req.params.id;
    BookModel.findOne({ _id: bookId })
        .then((book) => {
            if (!book) {
                res.status(404).json({
                    message: "Livre introuvable.",
                });
            } else if (book.userId.toString() !== req.auth.userId) {
                res.status(403).json({
                    message: "Vous n'êtes pas autorisé à supprimer ce livre.",
                });
            } else {
                const imageName = book.imageUrl.split("/images/")[1];
                BookModel.deleteOne({ _id: bookId })
                    .then(() => {
                        removeImageFile(`images/${imageName}`);
                        res.status(200).json({
                            message: "Le livre a été supprimé avec succès !",
                        });
                    })
                    .catch((err) => res.status(400).json({ error: err }));
            }
        })
        .catch((err) => res.status(500).json({ error: err }));
};

// Noter un livre
exports.rateBook = (req, res, next) => {
    const bookId = req.params.id;
    const { userId, rating } = req.body;

    if (rating < 0 || rating > 5) {
        return res.status(400).json({
            error: "NOTE_INVALIDE",
            message: "La note doit être comprise entre 0 et 5.",
        });
    }

    BookModel.findById(bookId)
        .then((book) => {
            if (!book) {
                throw new Error("LIVRE_NON_TROUVÉ");
            }

            return BookModel.findOne({ _id: bookId, "ratings.userId": userId }).then(
                (alreadyRated) => {
                    if (alreadyRated) {
                        throw new Error("DÉJÀ_NOTÉ");
                    }

                    const existingGrades = book.ratings.map((r) => r.grade);
                    const totalRatings = existingGrades.reduce(
                        (sum, grade) => sum + grade,
                        0
                    );

                    const newTotal = totalRatings + rating;
                    const newAverage = Number(
                        (newTotal / (book.ratings.length + 1)).toFixed(2)
                    );

                    book.ratings.push({ userId, grade: rating });
                    book.averageRating = newAverage;

                    return book.save().then((updatedBook) => {
                        res.status(201).json({
                            ...updatedBook._doc,
                            id: updatedBook._doc._id,
                        });
                    });
                }
            );
        })
        .catch((err) => {
            if (err.message === "LIVRE_NON_TROUVÉ") {
                return res.status(404).json({
                    error: err.message,
                    message: "Le livre n'existe pas.",
                });
            } else if (err.message === "DÉJÀ_NOTÉ") {
                return res.status(403).json({
                    error: err.message,
                    message: "Vous avez déjà attribué une note à ce livre.",
                });
            } else {
                return res.status(500).json({
                    error: err.message,
                    message: "Erreur lors de la notation du livre.",
                });
            }
        });
};
