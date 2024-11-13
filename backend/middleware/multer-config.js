const multer = require("multer");
const sharp = require("sharp");

// Types MIME acceptés pour les images
const acceptedImageTypes = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
};

// Configuration du stockage des images
const storage = multer.diskStorage({
    // Dossier de destination pour les images téléchargées
    destination: (req, file, callback) => {
        callback(null, "images");
    },
    // Génération du nom de fichier
    filename: (req, file, callback) => {
        const sanitizedFileName = file.originalname.split(" ").join("_");
        const extension = acceptedImageTypes[file.mimetype];
        callback(null, Date.now() + sanitizedFileName + "." + extension);
    },
});

// Filtrer les types de fichiers acceptés
const imageFilter = (req, file, callback) => {
    const isAccepted = acceptedImageTypes[file.mimetype];
    if (isAccepted) {
        callback(null, true);
    } else {
        callback(new Error("Type de fichier non supporté."), false);
    }
};

// Configuration de multer pour le téléchargement des images
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 4 * 1024 * 1024, // Limite de taille : 4 Mo
    },
    fileFilter: imageFilter,
}).single("image");

// Fonction pour redimensionner et compresser l'image
const resizeImage = (req, res, next) => {
    // Vérifie si un fichier a été téléchargé
    if (!req.file) {
        return next();
    }

    // Chemin du fichier image
    const imagePath = req.file.path;

    sharp(imagePath)
        .resize({ fit: "cover", height: 643, width: 500 })
        .webp({ quality: 85 })
        .toBuffer()
        .then((data) => {
            sharp(data)
                .toFile(imagePath)
                .then(() => {
                    next();
                })
                .catch((error) => {
                    next(error);
                });
        })
        .catch((error) => {
            next(error);
        });
};

// Middleware pour le téléchargement de l'image
const uploadImage = (req, res, next) => {
    upload(req, res, function (error) {
        if (error) {
            if (error.code === "LIMIT_FILE_SIZE") {
                // Erreur : Taille de fichier trop grande
                return res.status(400).json({
                    message: "Le fichier est trop volumineux (taille maximale : 4 Mo).",
                });
            } else if (error.message === "Type de fichier non supporté.") {
                // Erreur : Type de fichier non supporté
                return res.status(400).json({ message: error.message });
            } else {
                // Autres erreurs
                return res.status(400).json({ message: error.message });
            }
        }

        next();
    });
};

module.exports = {
    uploadImage,
    resizeImage,
};
