// Cara que monta o front e estabelece conexão. Sucessor do client.js
const { app, BrowserWindow, ipcMain } = require("electron"); // importa o electron para rodar web sem ser web
const net = require("net"); // mesmo modulo do client
const path = require("path"); // resolve caminhos de arquivos para diferentes plataformas

const PORT = 3000; // Porta a ser usada
const HOST = "127.0.0.1"; // IP do server, no caso localhost

let mainWindow; // Janela principal que será vista
let client; // guarda a conexão

// Configura e mostra a interface
function criarJanela() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // usa o preload na mesma pasta
      contextIsolation: true, // Segurança ativada
      sandbox: false, // Pode usar recursos do sistema
    },
  });

  // Carrega o HTML na janela
  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

// Quando o electron starta, roda a janela
app.whenReady().then(() => {
  criarJanela();

  // Inicia a conexão TCP pura
  client = net.createConnection({ port: PORT, host: HOST }, () => {
    // Se conectou, manda informações para o front end
    mainWindow.webContents.send(
      "msg-do-socket",
      "Conectado ao servidor WhatsCord!",
    );
  });

  // Escuta dados chegando do servidor e envia para a janela
  client.on("data", (data) => {
    const mensagem = data.toString("utf8").trim(); // Transforma byte em texto
    mainWindow.webContents.send("msg-do-socket", mensagem); // Repassa o texto para o front usando o mesmo canal
  });

  // Captura erros
  // Captura quedas bruscas (caiu a net, server crashou)
  client.on("error", (err) => {
    // Adiciona ERROR para renderizar aa janela
    mainWindow.webContents.send(
      "msg-do-socket",
      `ERROR;Erro de rede: ${err.message}`,
    );
  });

  // Captura quando o servidor é desligado
  client.on("end", () => {
    mainWindow.webContents.send(
      "msg-do-socket",
      "ERROR;O servidor foi desligado ou encerrou a conexão.",
    );
  });

  // Captura o fechamento do túnel TCP
  client.on("close", () => {
    mainWindow.webContents.send(
      "msg-do-socket",
      "ERROR;Conexão com o servidor fechada. Reinicie o aplicativo.",
    );
  });
});

// Escuta mensagens vindas do HTML e escreve no Socket TCP
ipcMain.on("msg-do-ui", (event, texto) => {
  if (client && !client.destroyed) {
    client.write(`${texto}\n`); // Mantém o delimitador \n
  } else {
    // Se o usuário tentar enviar mensagem com o servidor offline, avisa a UI
    event.sender.send(
      "msg-do-socket",
      "ERROR;Você está desconectado do servidor.",
    );
  }
});
