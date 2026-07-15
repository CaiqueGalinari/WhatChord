const { contextBridge, ipcRenderer } = require("electron");
const crypto = require("crypto"); // Biblioteca de criptografia

// Chave simétrica de 32 bytes. Ambos os clientes precisam ter a mesma chave.
const ENCRYPTION_KEY = "12345678901234567890123456789012";
const IV_LENGTH = 16; // Define o tamanho do ruído

// Faz com que o front possa chamar métodos sem usar o código direto (por segurança)
contextBridge.exposeInMainWorld("api", {
  enviarParaServidor: (texto) => ipcRenderer.send("msg-do-ui", texto), // função que o HTML pode usar para enviar mensagens
  receberDoServidor: (
    callback, // Função para o HTML ouvir o server
  ) => ipcRenderer.on("msg-do-socket", (event, dados) => callback(dados)), // Fica vigiando p ver se o server vai mandar algo

  // Inteligência de Criptografia injetada no Frontend
  // Chama a criptografia antes de enviar o texto
  criptografar: (texto) => {
    const iv = crypto.randomBytes(IV_LENGTH); // Cria um ruído aleatório para cada mensagem (IV)
    const cipher = crypto.createCipheriv(
      // prepara para embaralhar o texto, definindo o método
      "aes-256-cbc", // Advanced Encryption Standard - 256 bits - Cipher Block Chaining
      Buffer.from(ENCRYPTION_KEY), // Converte a senha em dados brutos
      iv, // Insere o ruído
    );

    let encrypted = cipher.update(texto, "utf8", "hex"); // transforma o texto em hexadecimal
    encrypted += cipher.final("hex"); // // finaliza a criptografia

    // Retorna o IV colado no texto cifrado
    return iv.toString("hex") + ":" + encrypted; // Envia no estilo RUÍDO:TEXTO_CIFRADO
  },

  descriptografar: (textoCifrado) => {
    // Tenta descriptografar, mas se a mensagem corromper ele captura o erro p n crashar
    try {
      // Pega o ruído e o texto cifrado
      const partes = textoCifrado.split(":");
      const iv = Buffer.from(partes[0], "hex");
      const encryptedText = Buffer.from(partes[1], "hex");

      // Usa a chave, o ruído e o estilo de criptografia para descriptografar
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY),
        iv,
      );
      let decrypted = decipher.update(encryptedText, "hex", "utf8"); // Passa de hexadecimal para texto
      decrypted += decipher.final("utf8"); // Finaliza a descriptografia

      // Retorna o texto descriptografado
      return decrypted;
    } catch (e) {
      return textoCifrado; // Se não for uma mensagem cifrada válida, ignora e mostra como chegou
    }
  },
});
