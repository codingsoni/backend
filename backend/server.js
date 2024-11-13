// Importation des modules nécessaires
const http = require("http");
const application = require("./app");

// Fonction pour avoir un port valide
const getValidPort = (value) => {
    const portNumber = parseInt(value, 10);

    if (isNaN(portNumber)) {
        return value;
    }
    if (portNumber >= 0) {
        return portNumber;
    }
    return false;
};


const port = getValidPort(process.env.PORT || "3000");
application.set("port", port);

// Gestionnaire des erreurs serveur
const handleServerError = (error) => {
    if (error.syscall !== "listen") {
        throw error;
    }
    const addr = httpServer.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port: " + port;
    switch (error.code) {
        case "EACCES":
            console.error(bind + " nécessite des privilèges élevés.");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " est déjà utilisé.");
            process.exit(1);
            break;
        default:
            throw error;
    }
};

// Création du serveur HTTP en utilisant application Express
const httpServer = http.createServer(application);

// Événement du serveur pour gérer les erreurs et confirmer le démarrage
httpServer.on("error", handleServerError);
httpServer.on("listening", () => {
    const addr = httpServer.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
    console.log("Le serveur est en écoute sur " + bind);
});

// Démarrage du serveur
httpServer.listen(port);
