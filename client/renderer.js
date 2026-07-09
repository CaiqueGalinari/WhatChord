const chat = document.getElementById("chat");
const inputMensagem = document.getElementById("mensagem");
const btnEnviar = document.getElementById("btnEnviar");

function adicionarNaTela(texto, remetente) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${remetente}:</strong> ${texto}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight; // Rola para o final
}

btnEnviar.addEventListener("click", () => {
  const texto = inputMensagem.value.trim();
  if (texto) {
    window.api.enviarParaServidor(texto);
    adicionarNaTela(texto, "Você");
    inputMensagem.value = "";
  }
});

// Recebe a mensagem do backend (socket) e joga na div
window.api.receberDoServidor((dados) => {
  adicionarNaTela(dados, "Servidor");
});
