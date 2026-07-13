// Captura elementos do DOM
const loginOverlay = document.getElementById("loginOverlay");
const nicknameInput = document.getElementById("nicknameInput");
const passwordInput = document.getElementById("passwordInput");
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");

const welcomeScreen = document.getElementById("welcomeScreen");
const chatHeader = document.getElementById("chatHeader");
const chat = document.getElementById("chat");
const chatInputGroup = document.getElementById("chatInputGroup");
const chatList = document.querySelector(".chat-list");
const chatHeaderName = document.querySelector(".chat-header .chat-name");
const inputMensagem = document.getElementById("mensagem");
const btnEnviar = document.getElementById("btnEnviar");

// Gerenciamento de Estado
let meuNickname = "";
let contatoSelecionado = null;
let usuariosOnline = []; // Guarda a última lista do servidor

const historicoMensagens = new Map();
const contatosComMensagemNaoLida = new Set(); // Guarda quem te mandou mensagem

// Adicione esta linha junto aos outros getElementById
const statusMessage = document.getElementById("statusMessage");

// Adicione esta função auxiliar para controlar o aviso
function mostrarAviso(msg, sucesso = false) {
  statusMessage.style.color = sucesso ? "var(--accent)" : "#ef5350";
  statusMessage.innerText = msg;

  // Apaga a mensagem da tela automaticamente após 4 segundos
  setTimeout(() => {
    if (statusMessage.innerText === msg) statusMessage.innerText = "";
  }, 4000);
}

function salvarMensagem(contato, texto, remetente) {
  if (!historicoMensagens.has(contato)) {
    historicoMensagens.set(contato, []);
  }
  historicoMensagens.get(contato).push({ texto, remetente });
}

function renderizarChatAtivo() {
  chat.innerHTML = "";
  if (historicoMensagens.has(contatoSelecionado)) {
    const mensagens = historicoMensagens.get(contatoSelecionado);
    mensagens.forEach((msg) => {
      const div = document.createElement("div");
      div.style.alignSelf =
        msg.remetente === "Você" ? "flex-end" : "flex-start";
      div.style.backgroundColor =
        msg.remetente === "Você" ? "#005c4b" : "var(--bg-panel)";
      div.innerHTML = `<strong>${msg.remetente}:</strong> ${msg.texto}`;
      chat.appendChild(div);
    });
  }
  chat.scrollTop = chat.scrollHeight;
}

function renderizarContatos() {
  chatList.innerHTML = "";

  usuariosOnline.forEach((user) => {
    if (user === meuNickname || user === "") return;

    const div = document.createElement("div");
    div.className = "chat-item";

    // Se o usuário está no Set de não lidos, adiciona a classe que mostra a bolinha
    if (contatosComMensagemNaoLida.has(user)) {
      div.classList.add("has-unread");
    }

    div.innerHTML = `
            <div class="avatar"></div>
            <div class="chat-info">
                <div class="chat-name">${user}</div>
                <div class="chat-preview">Online</div>
            </div>
            <div class="unread-indicator"></div>
        `;

    div.addEventListener("click", () => {
      contatoSelecionado = user;
      chatHeaderName.innerText = `Chat com ${user}`;
      inputMensagem.placeholder = `Mensagem para ${user}...`;

      // Troca as telas: Remove as boas vindas e mostra os blocos de chat
      welcomeScreen.classList.add("hidden");
      chatHeader.classList.remove("hidden");
      chat.classList.remove("hidden");
      chatInputGroup.classList.remove("hidden");

      // Remove a bolinha verde ao entrar no chat
      contatosComMensagemNaoLida.delete(user);
      div.classList.remove("has-unread");

      renderizarChatAtivo();
    });

    chatList.appendChild(div);
  });
}

// 1. Autenticação (Login e Registro)
btnLogin.addEventListener("click", () => {
  const nick = nicknameInput.value.trim();
  const pwd = passwordInput.value.trim();
  if (nick && pwd) {
    meuNickname = nick;
    window.api.enviarParaServidor(`LOGIN;${nick};${pwd}`);
  } else {
    mostrarAviso("Preencha o apelido e a senha para entrar!"); // Sem alert()
  }
});

btnRegister.addEventListener("click", () => {
  const nick = nicknameInput.value.trim();
  const pwd = passwordInput.value.trim();
  if (nick && pwd) {
    window.api.enviarParaServidor(`REGISTER;${nick};${pwd}`);
  } else {
    mostrarAviso("Preencha o apelido e a senha para se cadastrar!"); // Sem alert()
  }
});

passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") btnLogin.click();
});

// 2. Envio de Mensagem
btnEnviar.addEventListener("click", () => {
  const texto = inputMensagem.value.trim();
  if (texto && contatoSelecionado) {
    window.api.enviarParaServidor(`MESSAGE;${contatoSelecionado};${texto}`);
    salvarMensagem(contatoSelecionado, texto, "Você");
    renderizarChatAtivo();
    inputMensagem.value = "";
  }
});
inputMensagem.addEventListener("keypress", (e) => {
  if (e.key === "Enter") btnEnviar.click();
});

// 3. Roteamento (Escuta o Servidor)
window.api.receberDoServidor((dados) => {
  const partes = dados.split(";");
  const comando = partes[0];

  switch (comando) {
    case "REGISTER_OK":
      mostrarAviso("Conta criada com sucesso! Clique em 'Entrar'.", true);
      break;

    case "LOGIN_OK":
      loginOverlay.classList.add("hidden");
      window.api.enviarParaServidor("LIST");
      setInterval(() => window.api.enviarParaServidor("LIST"), 5000);
      break;

    case "LIST":
      usuariosOnline = partes.slice(1);
      renderizarContatos();
      break;

    case "MESSAGE":
      const remetente = partes[1];
      const textoRecebido = partes.slice(2).join(";");

      salvarMensagem(remetente, textoRecebido, remetente);

      // Se estou no chat da pessoa, mostra a msg. Se não, avisa na bolinha verde.
      if (contatoSelecionado === remetente) {
        renderizarChatAtivo();
      } else {
        contatosComMensagemNaoLida.add(remetente);
        renderizarContatos(); // Atualiza a lista instantaneamente para mostrar a bolinha
      }
      break;

    case "ERROR":
    case "ERRO":
      // Se a tela de login ainda estiver visível, mostra o erro nela
      if (!loginOverlay.classList.contains("hidden")) {
        mostrarAviso(`${partes[1] || dados}`);
      } else {
        // Se o erro ocorreu com o usuário já dentro do chat (ex: enviar mensagem para offline)
        // injeta a notificação como um texto centralizado no próprio chat
        const erroNoChat = document.createElement("div");
        erroNoChat.style.alignSelf = "center";
        erroNoChat.style.backgroundColor = "transparent";
        erroNoChat.style.color = "#ef5350";
        erroNoChat.style.boxShadow = "none";
        erroNoChat.innerHTML = `<em>Sistema: ${partes[1] || dados}</em>`;
        chat.appendChild(erroNoChat);
        chat.scrollTop = chat.scrollHeight;
      }
      break;
  }
});
