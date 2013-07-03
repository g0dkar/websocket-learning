/**
 * Servidor Socket.io de chat simples para aprendizado de WebSockets.
 * 
 * Dependências: socket.io
 *   - Execute "npm install socket.io" no diretório onde está este arquivo e em seguida "node <este-arquivo>"
 * 
 * @author Rafael g0dkar
 */

// namespace do socket.io, inicializado na porta 80
var io = require("socket.io").listen(80);

// Vamos guardar um mapa "nome-socket" de todos os clientes conectados.
// Utilizaremos isso para poder mandar mensagens privadas de um cliente a outro.
var USUARIOS_CONECTADOS = { };

// Um cliente abriu uma conexão! Vamos prepará-la!
io.sockets.on("connection", function (socket) {
	// Vamos configurar os comandos que podemos receber do cliente:
	
	// Comando "entrar" - O cliente entra numa sala de chat
	socket.on("entrar", function (data) {
		// O cliente especificou que sala ele quer entrar?
		if (data.sala) {
			// Este cliente já está numa sala?
			if (socket.sala) {
				// Sim, então vamos sair da sala antiga
				socket.part(socket.sala);
				
				// E avisar na sala antiga que este cliente saiu de lá
				io.sockets.in(socket.sala).emit("partiu", { cliente: socket.nomeCliente, motivo: "Foi para outra sala", usuarios: getListaUsuarios(socket.sala) });
			}
			
			// Guardamos a informação de que sala este socket está para facilitar futuramente
			socket.sala = limparTexto(data.sala.toLowerCase());
			
			// E informamos ao Socket.io que este cliente está dentro da sala especificada
			// Após este comando, toda comunicação enviada para esta sala chegará a este cliente
			socket.join(socket.sala);
			
			// Removemos temporariamente este socket da lista de usuários conectados
			delete(USUARIOS_CONECTADOS[socket.nomeCliente]);
			
			// Configuramos o nome dele:
			// Limpamos o nome
			data.nome = limparTexto(data.nome);
			
			// Se ele não for composto apenas de espaços, utilizamos ele
			if (/\S+/.test(data.nome)) {
				socket.nomeCliente = data.nome;
			}
			// Caso contrário, damos um nome aleatório
			else {
				socket.nomeCliente = "Visitante" + Math.floor(Math.random() * 10000);
			}
			
			// E agora que temos o novo nome, readicionamos ele:
			USUARIOS_CONECTADOS[socket.nomeCliente] = socket;
			
			// Agora que todo o procedimento foi concluído, avisamos a todos que há alguém novo na sala
			io.sockets.in(socket.sala).emit("entrou", { cliente: socket.nomeCliente, usuarios: getListaUsuarios(socket.sala) });
		}
		// Se não disse que sala ele quer entrar, mandamos um erro.
		else {
			socket.emit("erro", "Você precisa especificar que sala você quer entrar.");
		}
	});
	
	/* ******************* */
	
	// Comando "sair" - O cliente simplesmente saiu da sala de chat onde ele se encontra
	socket.on("sair", function (data) {
		// Este cliente já está numa sala?
		if (socket.sala) {
			// Sim, então vamos sair da sala
			socket.part(socket.sala);
			
			// Vamos marcar que este socket não está em sala alguma
			socket.sala = null;
			
			// E avisar que este cliente saiu de sua sala antiga
			io.sockets.in(socket.sala).emit("partiu", { cliente: socket.nomeCliente, motivo: data.motivo ? limparTexto(data.motivo) : "Saiu da sala", usuarios: getListaUsuarios(socket.sala) });
		}
		// Se não está em uma sala, mandamos um erro
		else {
			socket.emit("erro", "Você precisa estar numa sala para poder sair da mesma.");
		}
	});
	
	/* ******************* */
	
	// Comando "falar" - O cliente vai falar algo para todos na sala de chat onde ele está
	socket.on("falar", function (data) {
		// Este cliente está numa sala de chat?
		if (socket.sala) {
			// Faz um broadcast a todos dentro de uma sala
			io.sockets.in(socket.sala).emit("falando", { cliente: socket.nomeCliente, texto: limparTexto(data.texto) });
		}
		// Se não estiver, mandamos um erro.
		else {
			socket.emit("erro", "Você precisa entrar numa sala antes de poder falar.");
		}
	});
	
	/* ******************* */
	
	// Comando "falarPrivado" - O cliente vai falar algo para todos na sala de chat onde ele está
	socket.on("falarPrivado", function (data) {
		// Foi especificado para quem será a mensagem?
		if (data.nome) {
			// Este nome existe?
			if (USUARIOS_CONECTADOS[data.nome]) {
				// Vamos mandar uma mensagem a ele então:
				USUARIOS_CONECTADOS[data.nome].emit("falandoPrivado", { cliente: socket.nomeCliente, texto: limparTexto(data.texto) });
			}
			// Não existe, então mandamos um erro
			else {
				socket.emit("erro", "Usuário inexistente.");
			}
		}
		// Não foi especificado para quem é a mensagem, então mandamos um erro.
		else {
			socket.emit("erro", "Por favor, especifique para quem é a mensagem!");
		}
	});
	
	/* ******************* */
	
	// Quando um cliente desconectar
	socket.on("disconnect", function () {
		// Removemos este socket da lista de usuários conectados
		delete(USUARIOS_CONECTADOS[socket.nomeCliente]);
		
		if (socket.sala) {
			// E avisar na sala antiga que este cliente saiu de lá
			io.sockets.in(socket.sala).emit("partiu", { cliente: socket.nomeCliente, motivo: "Desconectou", usuarios: getListaUsuarios(socket.sala) });
		}
	});
	
	/* ******************* */
	
	// Agora que inicializamos tudo vamos emitir uma mensagem ao cliente avisando que está tudo ok
	socket.emit("ok");
});

/**
 * Limpa um texto, removendo qualquer HTML presente (proteção contra code injection, XSS, etc.)
 * e removendo espaços no começo e fim do texto
 * 
 * @return Texto sem tags HTML/XML
 */
function limparTexto(texto) {
	return texto ? texto.replace(/<[^>]*>|^\s+|\s+$/g, "") : null;
}

/**
 * Monta e envia a lista de usuários de um canal. Evite usar isso, hehe.
 *
 * @return Array com os nomes dos clientes na sala específica
 */
function getListaUsuarios(sala) {
	var usuarios = [];
	
	for (var user in USUARIOS_CONECTADOS) {
		if (USUARIOS_CONECTADOS[user].sala == sala) { usuarios.push(USUARIOS_CONECTADOS[user].nomeCliente); }
	}
	
	return usuarios;
}