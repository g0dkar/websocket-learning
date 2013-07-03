/**
 * Servidor Socket.io de chat simples para aprendizado de WebSockets.
 * 
 * Depend�ncias: socket.io
 *   - Execute "npm install socket.io" no diret�rio onde est� este arquivo e em seguida "node <este-arquivo>"
 * 
 * @author Rafael g0dkar
 */

// namespace do socket.io, inicializado na porta 80
var io = require("socket.io").listen(80);

// Vamos guardar um mapa "nome-socket" de todos os clientes conectados.
// Utilizaremos isso para poder mandar mensagens privadas de um cliente a outro.
var USUARIOS_CONECTADOS = { };

// Um cliente abriu uma conex�o! Vamos prepar�-la!
io.sockets.on("connection", function (socket) {
	// Vamos configurar os comandos que podemos receber do cliente:
	
	// Comando "entrar" - O cliente entra numa sala de chat
	socket.on("entrar", function (data) {
		// O cliente especificou que sala ele quer entrar?
		if (data.sala) {
			// Este cliente j� est� numa sala?
			if (socket.sala) {
				// Sim, ent�o vamos sair da sala antiga
				socket.part(socket.sala);
				
				// E avisar na sala antiga que este cliente saiu de l�
				io.sockets.in(socket.sala).emit("partiu", { cliente: socket.nomeCliente, motivo: "Foi para outra sala", usuarios: getListaUsuarios(socket.sala) });
			}
			
			// Guardamos a informa��o de que sala este socket est� para facilitar futuramente
			socket.sala = limparTexto(data.sala.toLowerCase());
			
			// E informamos ao Socket.io que este cliente est� dentro da sala especificada
			// Ap�s este comando, toda comunica��o enviada para esta sala chegar� a este cliente
			socket.join(socket.sala);
			
			// Removemos temporariamente este socket da lista de usu�rios conectados
			delete(USUARIOS_CONECTADOS[socket.nomeCliente]);
			
			// Configuramos o nome dele:
			// Limpamos o nome
			data.nome = limparTexto(data.nome);
			
			// Se ele n�o for composto apenas de espa�os, utilizamos ele
			if (/\S+/.test(data.nome)) {
				socket.nomeCliente = data.nome;
			}
			// Caso contr�rio, damos um nome aleat�rio
			else {
				socket.nomeCliente = "Visitante" + Math.floor(Math.random() * 10000);
			}
			
			// E agora que temos o novo nome, readicionamos ele:
			USUARIOS_CONECTADOS[socket.nomeCliente] = socket;
			
			// Agora que todo o procedimento foi conclu�do, avisamos a todos que h� algu�m novo na sala
			io.sockets.in(socket.sala).emit("entrou", { cliente: socket.nomeCliente, usuarios: getListaUsuarios(socket.sala) });
		}
		// Se n�o disse que sala ele quer entrar, mandamos um erro.
		else {
			socket.emit("erro", "Voc� precisa especificar que sala voc� quer entrar.");
		}
	});
	
	/* ******************* */
	
	// Comando "sair" - O cliente simplesmente saiu da sala de chat onde ele se encontra
	socket.on("sair", function (data) {
		// Este cliente j� est� numa sala?
		if (socket.sala) {
			// Sim, ent�o vamos sair da sala
			socket.part(socket.sala);
			
			// Vamos marcar que este socket n�o est� em sala alguma
			socket.sala = null;
			
			// E avisar que este cliente saiu de sua sala antiga
			io.sockets.in(socket.sala).emit("partiu", { cliente: socket.nomeCliente, motivo: data.motivo ? limparTexto(data.motivo) : "Saiu da sala", usuarios: getListaUsuarios(socket.sala) });
		}
		// Se n�o est� em uma sala, mandamos um erro
		else {
			socket.emit("erro", "Voc� precisa estar numa sala para poder sair da mesma.");
		}
	});
	
	/* ******************* */
	
	// Comando "falar" - O cliente vai falar algo para todos na sala de chat onde ele est�
	socket.on("falar", function (data) {
		// Este cliente est� numa sala de chat?
		if (socket.sala) {
			// Faz um broadcast a todos dentro de uma sala
			io.sockets.in(socket.sala).emit("falando", { cliente: socket.nomeCliente, texto: limparTexto(data.texto) });
		}
		// Se n�o estiver, mandamos um erro.
		else {
			socket.emit("erro", "Voc� precisa entrar numa sala antes de poder falar.");
		}
	});
	
	/* ******************* */
	
	// Comando "falarPrivado" - O cliente vai falar algo para todos na sala de chat onde ele est�
	socket.on("falarPrivado", function (data) {
		// Foi especificado para quem ser� a mensagem?
		if (data.nome) {
			// Este nome existe?
			if (USUARIOS_CONECTADOS[data.nome]) {
				// Vamos mandar uma mensagem a ele ent�o:
				USUARIOS_CONECTADOS[data.nome].emit("falandoPrivado", { cliente: socket.nomeCliente, texto: limparTexto(data.texto) });
			}
			// N�o existe, ent�o mandamos um erro
			else {
				socket.emit("erro", "Usu�rio inexistente.");
			}
		}
		// N�o foi especificado para quem � a mensagem, ent�o mandamos um erro.
		else {
			socket.emit("erro", "Por favor, especifique para quem � a mensagem!");
		}
	});
	
	/* ******************* */
	
	// Quando um cliente desconectar
	socket.on("disconnect", function () {
		// Removemos este socket da lista de usu�rios conectados
		delete(USUARIOS_CONECTADOS[socket.nomeCliente]);
		
		if (socket.sala) {
			// E avisar na sala antiga que este cliente saiu de l�
			io.sockets.in(socket.sala).emit("partiu", { cliente: socket.nomeCliente, motivo: "Desconectou", usuarios: getListaUsuarios(socket.sala) });
		}
	});
	
	/* ******************* */
	
	// Agora que inicializamos tudo vamos emitir uma mensagem ao cliente avisando que est� tudo ok
	socket.emit("ok");
});

/**
 * Limpa um texto, removendo qualquer HTML presente (prote��o contra code injection, XSS, etc.)
 * e removendo espa�os no come�o e fim do texto
 * 
 * @return Texto sem tags HTML/XML
 */
function limparTexto(texto) {
	return texto ? texto.replace(/<[^>]*>|^\s+|\s+$/g, "") : null;
}

/**
 * Monta e envia a lista de usu�rios de um canal. Evite usar isso, hehe.
 *
 * @return Array com os nomes dos clientes na sala espec�fica
 */
function getListaUsuarios(sala) {
	var usuarios = [];
	
	for (var user in USUARIOS_CONECTADOS) {
		if (USUARIOS_CONECTADOS[user].sala == sala) { usuarios.push(USUARIOS_CONECTADOS[user].nomeCliente); }
	}
	
	return usuarios;
}