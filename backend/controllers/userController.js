const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserModel = require("../models/User");

// Expressions régulières pour valider les emails et mots de passe
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*\d).{8,}$/;

// Fonction pour enregistrer un nouvel utilisateur
exports.registerUser = (req, res) => {
    const errors = [];

    // Vérification du format de l'email
    if (!emailRegex.test(req.body.email)) {
        errors.push("L'adresse email est invalide.");
    }
    // Vérification du format du mot de passe
    if (!passwordRegex.test(req.body.password)) {
        errors.push(
            "Le mot de passe doit contenir au moins 8 caractères et inclure au moins un chiffre."
        );
    }
    // Si des erreurs sont présentes, les renvoyer au client
    if (errors.length > 0) {
        return res.status(400).json({ messages: errors });
    }

    // Logique pour créer un nouvel utilisateur
    bcrypt
        .hash(req.body.password, 10)
        .then((hashedPassword) => {
            const newUser = new UserModel({
                email: req.body.email,
                password: hashedPassword,
            });
            newUser
                .save()
                .then(() =>
                    res.status(201).json({ message: "Utilisateur enregistré avec succès !" })
                )
                .catch((err) => res.status(400).json({ error: err }));
        })
        .catch((err) => res.status(500).json({ error: err }));
};

// Fonction pour authentifier un utilisateur
exports.authenticateUser = (req, res) => {
    // Logique pour la connexion
    UserModel.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                return res
                    .status(401)
                    .json({ message: "Identifiant ou mot de passe incorrect." });
            }
            bcrypt
                .compare(req.body.password, user.password)
                .then((isValid) => {
                    if (!isValid) {
                        return res.status(401).json({
                            message: "Identifiant ou mot de passe incorrect.",
                        });
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.TOKEN_SECRET,
                            { expiresIn: "24h" }
                        ),
                    });
                })
                .catch((err) => {
                    if (err instanceof bcrypt.BCryptError) {
                        return res.status(401).json({
                            message:
                                "Erreur lors de la vérification du mot de passe.",
                        });
                    } else {
                        return res.status(500).json({
                            message:
                                "Une erreur est survenue lors du processus de connexion.",
                        });
                    }
                });
        })
        .catch((err) => res.status(500).json({ error: err }));
};
