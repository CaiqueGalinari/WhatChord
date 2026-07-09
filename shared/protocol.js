// shared/protocol.js

// 1. Dicionário de comandos permitidos no protocolo
const COMMANDS = {
  LOGIN: "LOGIN", // Formato: LOGIN;nickname
  LIST: "LIST", // Formato: LIST
  MESSAGE: "MESSAGE", // Formato: MESSAGE;destino;texto
  LOGOUT: "LOGOUT", // Formato: LOGOUT
  ERROR: "ERROR", // Formato: ERROR;mensagem (Uso do servidor para avisar falhas)
};

/**
 * 2. Função de Parsing (Desconstrução)
 * Recebe a string pura do socket (ex: "MESSAGE;joao;Olá") e transforma em objeto.
 */
function parseMessage(rawString) {
  // O .split(';') é o coração do nosso protocolo, separando o comando dos parâmetros
  const parts = rawString.trim().split(";");
  const command = parts[0].toUpperCase();

  return {
    command: command, // Ex: "MESSAGE"
    args: parts.slice(1), // Ex: ["joao", "Olá"] (Array com o restante)
  };
}

/**
 * 3. Função de Formatação (Construção)
 * Pega o comando e os parâmetros e monta a string no padrão do protocolo.
 */
function formatMessage(command, ...args) {
  if (args.length > 0) {
    return `${command};${args.join(";")}`;
  }
  // Retorna apenas o comando se não houver argumentos (ex: "LIST")
  return command;
}

// Exporta as funções no padrão CommonJS (para ser compatível com o require do seu client.js)
module.exports = {
  COMMANDS,
  parseMessage,
  formatMessage,
};
