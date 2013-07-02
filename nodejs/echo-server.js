/**
 * Servidor Socket.io de echo para aprendizado de WebSockets.
 * 
 * Depend�ncias: socket.io
 *   - Execute "npm install socket.io" no diret�rio onde est� este arquivo e em seguida "node <este-arquivo>"
 * 
 * @author Rafael g0dkar
 */

// namespace do socket.io, inicializado na porta 80
var io = require("socket.io").listen(80);

// evento onConnection - quando uma nova conex�o chega ao servidor
io.sockets.on("connection", function (socket) {
	// Assim que a conex�o � feita, vamos emitir uma mensagem ao cliente
	socket.emit("hello", "world");
	
	// E vamos configurar um evento no socket deste cliente para quando recebermos uma mensagem dele:
	socket.on("mensagem do usuario", function (data) {
		// Vamos simplesmente logar 
		console.log("Dados enviados pelo usuario: ", data);
		
		// E retornar a mesma coisa para o usu�rio
		// socket.emit("<comando>"[, dados]);		onde "dados" = qualquer coisa: string, n�meros, objetos, ... (opcional)
		socket.emit("mensagem do usuario", data);
		
		// Opcionalmente, podemos enviar a mesma coisa a todos os clientes conectados no momento
		// atrav�s de uma opera��o chamada "broadcast":
		// 
		// io.sockets.emit("mensagem do usuario", data);
	});
});