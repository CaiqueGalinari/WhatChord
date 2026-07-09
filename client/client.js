const net = require("net");
const readline = require("readline");

// Configurações da rede
const PORT = 3000; // Porta combinada com o Servidor
const HOST = "127.0.0.1"; // Localhost

// 1. Cria a interface assíncrona de terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

// 2. Inicia a conexão TCP pura
const client = net.createConnection({ port: PORT, host: HOST }, () => {
  console.log("Conectado ao servidor!");
  console.log(
    'Digite seu comando (Ex: LOGIN;seu_nome) ou "SAIR" para encerrar:',
  );

  // Libera o terminal para o usuário digitar
  rl.prompt();
});

// 3. Escuta eventos de entrada do usuário (digitação)
rl.on("line", (input) => {
  const texto = input.trim();

  // Comando local para encerrar o cliente graciosamente
  if (texto.toUpperCase() === "SAIR") {
    console.log("Encerrando conexão...");
    client.end(); // Dispara o FIN do TCP
    rl.close();
    return;
  }

  // Envia o texto para o servidor adicionando a quebra de linha como delimitador
  client.write(`${texto}\n`);
  rl.prompt();
});

// 4. Escuta pacotes chegando do servidor
client.on("data", (data) => {
  // Truque de interface: limpa a linha atual de digitação para a mensagem do servidor não "cortar" o texto do usuário
  process.stdout.clearLine();
  process.stdout.cursorTo(0);

  const mensagem = data.toString("utf8").trim();
  console.log(`[Servidor]: ${mensagem}`);

  // Devolve o cursor de digitação
  rl.prompt();
});

// 5. Trata encerramentos e erros
client.on("end", () => {
  console.log("\nO servidor encerrou a conexão.");
  rl.close();
});

client.on("error", (err) => {
  console.log(`\nErro de rede: ${err.message}`);
  // Se o servidor estiver desligado, o erro ECONNREFUSED cairá aqui
  rl.close();
});
