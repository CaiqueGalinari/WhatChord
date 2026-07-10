# 💬 WhatChord

WhatChord é uma aplicação de chat desenvolvida para a disciplina de **Redes de Computadores 1**, utilizando o modelo **Cliente/Servidor** com sockets TCP em Node.js.

---

## 🚀 Tecnologias utilizadas

- Node.js
- Electron
- Socket TCP (módulo nativo `net`)
- JavaScript

---

## 📁 Estrutura do projeto

```
WhatChord/
├── client/
│   ├── main.js
│   ├── preload.js
│   ├── renderer.js
│   └── index.html
├── server/
│   └── server.js
├── shared/
│   └── protocol.js
├── package.json
└── README.md
```

---

## 📋 Requisitos

- Node.js (versão 18 ou superior)
- npm

---

## ⚙️ Instalação

Clone o repositório:

```bash
git clone https://github.com/CaiqueGalinari/WhatChord.git
```

Entre na pasta do projeto:

```bash
cd WhatChord
```

Instale as dependências:

```bash
npm install
```

---

## 🖥️ Executando o servidor

Abra um terminal na pasta do projeto e execute:

```bash
npm run start:server
```

O servidor será iniciado na porta **3000**.

---

## 💻 Executando o cliente

Em outro terminal execute:

```bash
npm run start:client
```

Será aberta a interface gráfica do chat.

É possível abrir mais de um cliente para testar a comunicação entre usuários.

---

# 📡 Protocolo da aplicação

O sistema utiliza mensagens no formato:

```
COMANDO;parametro1;parametro2
```

### 🔐 LOGIN

Registra um usuário no servidor.

```
LOGIN;Mateus
```

Resposta:

```
LOGIN_OK;Bem-vindo Mateus
```

---

### 👥 LIST

Retorna a lista de usuários conectados.

```
LIST
```

Resposta:

```
LIST;Mateus;Joao;Maria
```

---

### 💬 MESSAGE

Envia uma mensagem para outro usuário.

```
MESSAGE;Joao;Olá João!
```

Resposta para o destinatário:

```
MESSAGE;Mateus;Olá João!
```

Resposta para o remetente:

```
MESSAGE_OK
```

---

### 🚪 LOGOUT

Encerra a conexão com o servidor.

```
LOGOUT
```

Resposta:

```
LOGOUT_OK
```

---

### ❌ ERROR

Retornado quando ocorre algum erro.

Exemplos:

```
ERROR;Nickname já está em uso
```

```
ERROR;Usuário não encontrado
```

---

## ✅ Funcionalidades implementadas

- ✔️ Servidor TCP utilizando o módulo nativo `net`
- ✔️ Comunicação Cliente/Servidor
- ✔️ Registro de usuários (nickname)
- ✔️ Lista de usuários conectados
- ✔️ Envio de mensagens privadas
- ✔️ Encerramento adequado da conexão
- ✔️ Tratamento de erros
- ✔️ Protocolo compartilhado entre cliente e servidor (`shared/protocol.js`)

---

## 🏗️ Arquitetura

O projeto é dividido em três módulos:

- **📂 client** → Interface gráfica e comunicação com o servidor.
- **📂 server** → Gerenciamento das conexões, usuários e roteamento das mensagens.
- **📂 shared** → Definição do protocolo de comunicação utilizado por cliente e servidor.

---

## 👨‍💻 Autores

- Mateus Santos
- Caique G.

**Disciplina:** Redes de Computadores 1  
**Universidade Federal de Ouro Preto (UFOP)**