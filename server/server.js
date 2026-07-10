const net = require("net");
const {
  COMMANDS,
  parseMessage,
  formatMessage,
} = require("../shared/protocol");

const PORT = 3000;

// Guarda os usuários conectados
const clientes = new Map();

const servidor = net.createServer((socket) => {
  console.log("Novo cliente conectado!");

  // Recebe mensagens do cliente
  socket.on("data", (data) => {
    const { command, args } = parseMessage(data.toString());

    console.log("Recebido:", command, args);

    switch (command) {
      case COMMANDS.LOGIN: {
        const nickname = args[0];

        if (!nickname) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Nickname inválido") + "\n"
          );
          return;
        }

        if (clientes.has(nickname)) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Nickname já está em uso") + "\n"
          );
          return;
        }

        clientes.set(nickname, socket);
        socket.nickname = nickname;

        console.log(`${nickname} entrou no chat.`);

        socket.write(
          formatMessage(COMMANDS.LOGIN_OK, `Bem-vindo ${nickname}`) + "\n"
        );
        break;
      }

      case COMMANDS.LIST: {
        const usuarios = [...clientes.keys()];

        socket.write(
          formatMessage(COMMANDS.LIST, ...usuarios) + "\n"
        );
        break;
      }

      case COMMANDS.MESSAGE: {
        const destino = args[0];
        const texto = args.slice(1).join(";");

        if (!socket.nickname) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Faça LOGIN primeiro") + "\n"
          );
          return;
        }

        const socketDestino = clientes.get(destino);

        if (!socketDestino) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Usuário não encontrado") + "\n"
          );
          return;
        }

        socketDestino.write(
          formatMessage(COMMANDS.MESSAGE, socket.nickname, texto) + "\n"
        );

        socket.write(
          formatMessage(COMMANDS.MESSAGE_OK) + "\n"
        );

        console.log(`${socket.nickname} -> ${destino}: ${texto}`);
        break;
      }

      case COMMANDS.LOGOUT: {
        if (socket.nickname) {
          console.log(`${socket.nickname} saiu do chat.`);

          clientes.delete(socket.nickname);

          socket.write(
            formatMessage(COMMANDS.LOGOUT_OK) + "\n"
          );

          socket.end();
        }
        break;
      }

      default:
        socket.write(
          formatMessage(COMMANDS.ERROR, "Comando desconhecido") + "\n"
        );
    }
  });

  // Cliente desconectou
  socket.on("end", () => {
    if (socket.nickname) {
      clientes.delete(socket.nickname);
      console.log(`${socket.nickname} saiu do chat.`);
    }

    console.log("Cliente desconectado.");
  });

  // Tratamento de erro
  socket.on("error", (err) => {
    console.log("Erro:", err.message);

    if (socket.nickname) {
      clientes.delete(socket.nickname);
    }
  });
});

// Inicia o servidor
servidor.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});