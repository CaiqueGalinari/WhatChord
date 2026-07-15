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
let meuNickname = ""; // Armazena o nome do user logado
let contatoSelecionado = null; // Fala quem ta no foco atual
let usuariosOnline = []; // Guarda a última lista do servidor

const historicoMensagens = new Map(); // Vincula o contato às mensagens trocadas por ele
const contatosComMensagemNaoLida = new Set(); // Guarda quem te mandou mensagem e você não leu

// Captura a div para mostrar erros
const statusMessage = document.getElementById("statusMessage");

// Padroniza o feedback visual de alertas
function mostrarAviso(msg, sucesso = false) {
  statusMessage.style.color = sucesso ? "var(--accent)" : "#ef5350";
  statusMessage.innerText = msg;

  // Apaga a mensagem da tela automaticamente após 4 segundos
  setTimeout(() => {
    if (statusMessage.innerText === msg) statusMessage.innerText = "";
  }, 4000);
}

// Função para persistir conversa localmente
function salvarMensagem(contato, texto, remetente) {
  if (!historicoMensagens.has(contato)) {
    historicoMensagens.set(contato, []);
  }
  historicoMensagens.get(contato).push({ texto, remetente }); // tupla (texto; quem enviou)
}

// Renderiza a conversa atual na tela
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

// Desenha e atualiza a lista de contatos (usuarios ativos)
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

// Login ao apertar botão de login
btnLogin.addEventListener("click", () => {
  const nick = nicknameInput.value.trim();
  const pwd = passwordInput.value.trim();
  if (nick && pwd) {
    // barra valores vazios
    meuNickname = nick;
    window.api.enviarParaServidor(`LOGIN;${nick};${pwd}`);
  } else {
    mostrarAviso("Preencha o apelido e a senha para entrar!");
  }
});

// Cadastro ao apertar o botao de cadastro
btnRegister.addEventListener("click", () => {
  const nick = nicknameInput.value.trim();
  const pwd = passwordInput.value.trim();
  if (nick && pwd) {
    window.api.enviarParaServidor(`REGISTER;${nick};${pwd}`); // Dispacha para o node e depois para o server a solicitação de cadastro
  } else {
    mostrarAviso("Preencha o apelido e a senha para se cadastrar!");
  }
});

// Aperta automatico no login se der enter depois de digitar a senha
passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") btnLogin.click();
});

// Envio de Mensagem ao apertar o botão de enviar
btnEnviar.addEventListener("click", () => {
  const texto = inputMensagem.value.trim();
  // Se o texto for válido e tiver contato selecionado...
  if (texto && contatoSelecionado) {
    const textoCifrado = window.api.criptografar(texto); // criptografa o texto
    // Manda para o server dentro do protocolo (MESSAGE;CONTATO;MENSAGEM)
    window.api.enviarParaServidor(
      `MESSAGE;${contatoSelecionado};${textoCifrado}`,
    );
    // Salva no histórico para exibir
    salvarMensagem(contatoSelecionado, texto, "Você");
    renderizarChatAtivo(); // Atualiza a tela
    inputMensagem.value = ""; // Limpa a barra de texto
  }
});

// Envia mensagem com enter também
inputMensagem.addEventListener("keypress", (e) => {
  if (e.key === "Enter") btnEnviar.click();
});

// Roteamento (fica ouvindo o server)
window.api.receberDoServidor((dados) => {
  const partes = dados.split(";");
  const comando = partes[0]; // Pega o comando e faz switch case

  switch (comando) {
    case "REGISTER_OK":
      mostrarAviso("Conta criada com sucesso! Clique em 'Entrar'.", true);
      break;

    case "LOGIN_OK":
      loginOverlay.classList.add("hidden");
      window.api.enviarParaServidor("LIST");
      setInterval(() => window.api.enviarParaServidor("LIST"), 5000); // fica solicitando a lista para o servidor
      break;

    // Recebe a lista do servidor
    case "LIST":
      usuariosOnline = partes.slice(1);
      renderizarContatos();
      break;

    // Recebe mensagem e descriptografa
    case "MESSAGE":
      const remetente = partes[1];
      const textoRecebidoCifrado = partes.slice(2).join(";");

      const textoDecifrado = window.api.descriptografar(textoRecebidoCifrado);
      salvarMensagem(remetente, textoDecifrado, remetente);

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
