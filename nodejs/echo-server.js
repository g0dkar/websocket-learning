/**
 * Servidor Socket.io de echo para aprendizado de WebSockets.
 * 
 * Dependências: socket.io
 *   - Execute "npm install socket.io" no diretório onde está este arquivo e em seguida "node <este-arquivo>"
 * 
 * @author Rafael g0dkar
 */

// namespace do socket.io, inicializado na porta 80
var io = require("socket.io").listen(80);

// evento onConnection - quando uma nova conexão chega ao servidor
io.sockets.on("connection", function (socket) {
	// Assim que a conexão é feita, vamos emitir uma mensagem ao cliente
	socket.emit("hello", "world");
	
	// E vamos configurar um evento no socket deste cliente para quando recebermos uma mensagem dele:
	socket.on("mensagem do usuario", function (data) {
		// Vamos simplesmente logar 
		console.log("Dados enviados pelo usuario: ", data);
		
		// E retornar a mesma coisa para o usuário
		// socket.emit("<comando>"[, dados]);		onde "dados" = qualquer coisa: string, números, objetos, ... (opcional)
		socket.emit("mensagem do usuario", data);
		
		// Opcionalmente, podemos enviar a mesma coisa a todos os clientes conectados no momento
		// através de uma operação chamada "broadcast":
		// 
		// io.sockets.emit("mensagem do usuario", data);
	});
});