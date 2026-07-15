// Responsável por mediar as conexões
const net = require("net"); // importa o net para TCP
const { COMMANDS, parseMessage, formatMessage } = require("../shared/protocol"); // importa o protocolo compartilhado e todo o resto

const PORT = 3000; // define a porta (precisa ser a mesma do client, se for testar outra)

// Banco de dados temporário de usuários cadastrados (Chave: nickname -> Valor: senha)
const bancoDeUsuarios = new Map();

// Guarda apenas os usuários com socket ativo no momento
const clientes = new Map();

// instancia o servidor, dá um socket diferente para cada cliente conectado
const servidor = net.createServer((socket) => {
  console.log("Novo cliente conectado!");

  // Começa a ouvir os clientes
  socket.on("data", (data) => {
    const { command, args } = parseMessage(data.toString()); // converte byte para string legível
    console.log("Recebido:", command, args); // imprime no log que recebeu certinho

    // Para cada comando:
    switch (command) {
      // salva o usuário cadastrado, se vier os dados certinhos e se ele já não existir
      case COMMANDS.REGISTER: {
        const nickname = args[0];
        const senha = args[1];

        if (!nickname || !senha) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Nickname e senha são obrigatórios") +
              "\n",
          );
          return;
        }

        if (bancoDeUsuarios.has(nickname)) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Nickname já está cadastrado") + "\n",
          );
          return;
        }

        // Salva a entidade no repositório de registro
        bancoDeUsuarios.set(nickname, senha);
        console.log(`Novo registro no banco: ${nickname}`);

        socket.write(
          formatMessage(
            COMMANDS.REGISTER_OK,
            "Usuário registrado com sucesso",
          ) + "\n",
        );
        break;
      }

      // Checa integridade dos dados e vê se ele existe
      case COMMANDS.LOGIN: {
        const nickname = args[0];
        const senha = args[1]; // Agora o protocolo exige a senha

        if (!nickname || !senha) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Nickname e senha são obrigatórios") +
              "\n",
          );
          return;
        }

        // Validação de Arquitetura: Verifica se o usuário existe, etc
        if (!bancoDeUsuarios.has(nickname)) {
          socket.write(
            formatMessage(
              COMMANDS.ERROR,
              "Usuário não encontrado. Registre-se primeiro.",
            ) + "\n",
          );
          return;
        }

        // Verifica se a senha confere com a salva no Map
        if (bancoDeUsuarios.get(nickname) !== senha) {
          socket.write(formatMessage(COMMANDS.ERROR, "Senha incorreta") + "\n");
          return;
        }

        if (clientes.has(nickname)) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Usuário já está online") + "\n",
          );
          return;
        }

        clientes.set(nickname, socket);
        socket.nickname = nickname;

        console.log(`${nickname} entrou no chat.`);
        socket.write(
          formatMessage(COMMANDS.LOGIN_OK, `Bem-vindo ${nickname}`) + "\n",
        );
        break;
      }

      // Envia a lista de usuarios conectados para o cliente
      case COMMANDS.LIST: {
        const usuarios = [...clientes.keys()];
        socket.write(formatMessage(COMMANDS.LIST, ...usuarios) + "\n");
        break;
      }

      // Envia a mensagem para o lugar certo
      case COMMANDS.MESSAGE: {
        const destino = args[0];
        const texto = args.slice(1).join(";");

        if (!socket.nickname) {
          socket.write(
            formatMessage(COMMANDS.ERROR, "Faça LOGIN primeiro") + "\n",
          );
          return;
        }

        const socketDestino = clientes.get(destino); // Pega o socket do cliente de destino

        if (!socketDestino) {
          socket.write(
            formatMessage(
              COMMANDS.ERROR,
              "Usuário não está online no momento",
            ) + "\n",
          );
          return;
        }

        // Envia para o socket certo a mensagem
        socketDestino.write(
          formatMessage(COMMANDS.MESSAGE, socket.nickname, texto) + "\n",
        );
        socket.write(formatMessage(COMMANDS.MESSAGE_OK) + "\n");
        console.log(`${socket.nickname} -> ${destino}: ${texto}`);
        break;
      }

      case COMMANDS.LOGOUT: {
        if (socket.nickname) {
          console.log(`${socket.nickname} saiu do chat.`);
          clientes.delete(socket.nickname);
          socket.write(formatMessage(COMMANDS.LOGOUT_OK) + "\n");
          socket.end();
        }
        break;
      }

      // Se não for nenhum dos acima...
      default:
        socket.write(
          formatMessage(COMMANDS.ERROR, "Comando desconhecido") + "\n",
        );
    }
  });

  socket.on("end", () => {
    if (socket.nickname) {
      clientes.delete(socket.nickname);
      console.log(`${socket.nickname} saiu do chat.`);
    }
  });

  socket.on("error", (err) => {
    console.log("Erro:", err.message);
    if (socket.nickname) {
      clientes.delete(socket.nickname);
    }
  });
});

servidor.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
