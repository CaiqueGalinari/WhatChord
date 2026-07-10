const net = require("net");

const PORT = 3000;

// Guarda os usuários conectados
const clientes = new Map();

const servidor = net.createServer((socket) => {
  console.log("Novo cliente conectado!");

  // Recebe mensagens do cliente
socket.on("data", (data) => {
  const mensagem = data.toString().trim();
  console.log("Recebido:", mensagem);

  const partes = mensagem.split(";");
  const comando = partes[0];

  switch (comando) {

    case "LOGIN": {
      const nickname = partes[1];

      if (!nickname) {
        socket.write("ERRO;Nickname inválido.\n");
        return;
      }

      if (clientes.has(nickname)) {
        socket.write("ERRO;Nickname já está em uso.\n");
        return;
      }

      clientes.set(nickname, socket);
      socket.nickname = nickname;

      console.log(`${nickname} entrou no chat.`);

      socket.write(`LOGIN_OK;Bem-vindo ${nickname}\n`);
      break;
    }

    case "LIST": {
      const usuarios = [...clientes.keys()];
      socket.write(`LIST;${usuarios.join(",")}\n`);
      break;
    }

    case "MESSAGE": {

      const destino = partes[1];
      const texto = partes.slice(2).join(";");

      if (!socket.nickname) {
        socket.write("ERRO;Faça LOGIN primeiro.\n");
        return;
      }

      const socketDestino = clientes.get(destino);

      if (!socketDestino) {
        socket.write("ERRO;Usuário não encontrado.\n");
        return;
      }

      socketDestino.write(`MESSAGE;${socket.nickname};${texto}\n`);

      socket.write("MESSAGE_OK\n");

      console.log(`${socket.nickname} -> ${destino}: ${texto}`);

      break;
    }
	
	case "LOGOUT": {
	  if (socket.nickname) {
	    console.log(`${socket.nickname} saiu do chat.`);
		  clientes.delete(socket.nickname);
		  socket.write("LOGOUT_OK\n");
		  socket.end();
		}
	  break;
	}

    default:
      socket.write("ERRO;Comando desconhecido.\n");
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