const { contextBridge, ipcRenderer } = require("electron");
const crypto = require("crypto");

// Chave simétrica de 32 bytes (256 bits). Ambos os clientes precisam ter a mesma chave.
const ENCRYPTION_KEY = "12345678901234567890123456789012";
const IV_LENGTH = 16; // O Vetor de Inicialização do AES

contextBridge.exposeInMainWorld("api", {
  enviarParaServidor: (texto) => ipcRenderer.send("msg-do-ui", texto),
  receberDoServidor: (callback) =>
    ipcRenderer.on("msg-do-socket", (event, dados) => callback(dados)),

  // Inteligência de Criptografia injetada no Frontend
  criptografar: (texto) => {
    // Cria um ruído aleatório para cada mensagem (IV)
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );

    let encrypted = cipher.update(texto, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Retorna o IV colado no texto cifrado (separado por dois pontos)
    return iv.toString("hex") + ":" + encrypted;
  },

  descriptografar: (textoCifrado) => {
    try {
      const partes = textoCifrado.split(":");
      const iv = Buffer.from(partes[0], "hex");
      const encryptedText = Buffer.from(partes[1], "hex");

      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY),
        iv,
      );
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (e) {
      return textoCifrado; // Se não for uma mensagem cifrada válida, ignora e mostra como chegou
    }
  },
});
