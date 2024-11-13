const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        // Récupérer le token depuis l'en-tête Authorization
        const token = req.headers.authorization.split(" ")[1];
        // Vérifier et décoder le token
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        // Extraire l'ID de l'utilisateur du token
        const userId = decodedToken.userId;
        // Stocker l'ID de l'utilisateur dans req.auth
        req.auth = { userId };
        // Passer au middleware suivant
        next();
    } catch (error) {
        // En cas d'erreur, renvoyer une réponse 401 (Non autorisé)
        res.status(401).json({ error: "Requête non authentifiée" });
    }
};

