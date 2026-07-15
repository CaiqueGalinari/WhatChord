// Dicionário de comandos permitidos no protocolo
const COMMANDS = {
  REGISTER: "REGISTER",
  REGISTER_OK: "REGISTER_OK",

  LOGIN: "LOGIN",
  LOGIN_OK: "LOGIN_OK",

  LIST: "LIST",
  MESSAGE: "MESSAGE",
  MESSAGE_OK: "MESSAGE_OK",
  LOGOUT: "LOGOUT",
  LOGOUT_OK: "LOGOUT_OK",
  ERROR: "ERROR",
};

/**
 * 2. Função de Parsing
 * Recebe a string pura do socket (COMMAND;CONTATO;MENSAGEM) e transforma em objeto.
 */
function parseMessage(rawString) {
  // O .split(';') separa os campos
  const parts = rawString.trim().split(";");
  const command = parts[0].toUpperCase();

  return {
    command: command, // COMMAND
    args: parts.slice(1), // [CONTATO, MENSAGEM]
  };
}

/**
 * Função de construção
 * Pega o comando e os parâmetros e monta a string no padrão do protocolo.
 */
function formatMessage(command, ...args) {
  if (args.length > 0) {
    return `${command};${args.join(";")}`;
  }
  // Retorna apenas o comando se não houver argumentos (ex: "LIST")
  return command;
}

// Exporta as funções no padrão CommonJS (para ser compatível com o require do main.js)
module.exports = {
  COMMANDS,
  parseMessage,
  formatMessage,
};
