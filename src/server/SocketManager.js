﻿const io = require('./index.js').io

const { VERIFY_USER, VERIFY_USER_GOOGLE, USER_CONNECTED, USER_DISCONNECTED, 
		LOGOUT, COMMUNITY_CHAT, MESSAGE_RECIEVED, MESSAGE_SENT,
		TYPING, PRIVATE_MESSAGE, NEW_CHAT_USER, OLD_MESSAGE, OLD_LOADER,END_OLD_LOADER,REGISTER} = require('../Events')

const { createUser, createMessage, createChat } = require('../Factories')

let connectedUsers = { }

let communityChat = createChat({ isCommunity:true })
var mysql = require('mysql');
 
console.log('Get connection ...');
 
var conn = mysql.createConnection({
  database: 'chat',
  host: "localhost",
  user: "root",
  password: ""
});
 
conn.connect(function(err) {
  if (err) throw err;
  console.log("SQL Connected!");
});

module.exports = function(socket){
					
	// console.log('\x1bc'); //clears console
	console.log("Socket Id:" + socket.id);

	let sendMessageToChatFromUser;
	let sendMessageToChatFromOld;
	let sendEndOld;

	let sendTypingFromUser;

	socket.on(OLD_MESSAGE, (active)=>{
		console.log(active);
		// Lấy tin nhắn cũ từ database ra, dò theo userid? active chat (biến) lưu thông tin người đang chat với nhau,
		// users trong active lưu dưới dạng mảng, lấy ra 0 với 1 nghĩa là id của 2 người đầu tiên
		let sender = active.users[0];
		let reciever = active.users[1]; 
		//Câu sqllaays ra những message của 2 người (1)
		let sql = `select * from connection where p1 = "${sender}" and p2="${reciever}" or p2 = "${sender}" and p1="${reciever}" `;
		console.log(sql)

		//let sql = `INSERT INTO connection value ('',"${sender}", "${reciever}","${newChat.id}","${recieverSocket}")`;
		conn.query(sql, function(err, results) {// Thực hiện câu sql ở trên
			if (err) throw err; // Nếu lỗi thì hiển thị 
			if (results.length == 0 && !active.isCommunity){ //Nếu chưa từng chat với nhau thì lưu câu user x đã kết nối với user y (2)
				sql = `insert connection value ('',"${sender}","${reciever}","${active.id}","${sender} connected with ${reciever}")`
				conn.query(sql, function(err, results) {
					if (err) throw err; 
				});
			}
			results.map((e) => { // Gửi lại message lấy được từ database về cho client
				let message = e.msg // lấy message trong dâtbase 
				let p1 = e.p1 // Lấy tên người gửi
				//console.log(sender)
				// console.log(p1)
				// if(p1!==sender)
				 console.log(`${OLD_LOADER}-${active.id}`)
				 io.emit(`${OLD_LOADER}-${active.id}`, createMessage({message, sender})) // Gửi về cho datataabasddeeer hiển thị
				// //io.emit(`${MESSAGE_RECIEVED}-${active.id}`, createMessage({message,p1}))
				// else
				//sendMessageToChatFromOld(active.id, message)
				//sendMessageToChat(reciever);
			});
			io.emit(`${END_OLD_LOADER}-${active.id}`);
		});
		
		 sql = `update connection set p1sid="${active.id}"  where p1 = "${sender}" and p2="${reciever}"  or p2 = "${sender}" and p1="${reciever}"`;
		console.log(sql);
		conn.query(sql, function(err, results) {
			if (err) throw err;
		});
		// sendEndOld(active.id);

		
		// console.log(sender);
	})
	//Verify Username
	socket.on(REGISTER, (nickname, password, callback)=>{
		let sql = `select * from user where username = "${nickname}" and password = md5("${password}")`;
		conn.query(sql, function(err, results) {
			console.log(sql)
			if (err) throw err;
			if(results.length<1){ 
				// callback({ isUser:false, user:null })
				var us = createUser({name:nickname, socketId:socket.id})
				callback({ isUser:false, user:us})
				let sql = `insert into user value("","${nickname}",md5("${password}"),"")`;
				conn.query(sql, function(err, results) {
					if (err) throw err;
				});
				// Cập nhật lại id theo socket id 
				sql = `select * from connection where p1 = "${nickname}" `;
				console.log(sql);
				var old_p1="";
				conn.query(sql, function(err, results) {
					if (err) throw err;
					if(results.length>0){
						
					old_p1 = results[0].p1sid;
					let sql = `update connection set p1sid = "${us.id}" where p1="${nickname}" `;
					console.log(sql);
					conn.query(sql, function(err, results) {
						if (err) throw err;
					});
					/* sql = `update message set sender = "${us.id}" where sender="${old_p1}"`;
					 console.log(sql);
					 conn.query(sql, function(err, results) {
						if (err) throw err;
					});*/
					}
				});
				
			}
			else{
				console.log("wrong -_-");	
			callback({ isUser:false, user:null })
			}	
		}
	)
	if(isUser(connectedUsers, nickname)){
		callback({ isUser:true, user:null })
	}
});
socket.on(VERIFY_USER, (nickname, password, callback)=>{
		let sql = `select * from user where username = "${nickname}" and password = md5("${password}")`;
		conn.query(sql, function(err, results) {
			console.log(sql)
			if (err) throw err;
			if(results.length<1){
				//callback({ isUser:false, user:null })
			console.log("wrong -_-");	
			callback({ isUser:false, user:null })
			}
			else{
				var us = createUser({name:nickname, socketId:socket.id})
				callback({ isUser:false, user:us})
				
				let sql = `select * from connection where p1 = "${nickname}" `;
				console.log(sql);
				var old_p1="";
				conn.query(sql, function(err, results) {
					if (err) throw err;
					if(results.length>0){
						
					old_p1 = results[0].p1sid;
					let sql = `update connection set p1sid = "${us.id}" where p1="${nickname}" `;
					console.log(sql);
					conn.query(sql, function(err, results) {
						if (err) throw err;
					});
					/* sql = `update message set sender = "${us.id}" where sender="${old_p1}"`;
					 console.log(sql);
					 conn.query(sql, function(err, results) {
						if (err) throw err;
					});*/
					}
				});
				}
		}
	)
	if(isUser(connectedUsers, nickname)){
		callback({ isUser:true, user:null })
	}
});
<<<<<<< HEAD
	//User Connects with username 
=======
socket.on(VERIFY_USER_GOOGLE, (nickname, callback)=>{
	if(isUser(connectedUsers, nickname)){
		callback({ isUser:true, user:null })
	}else{
		var us = createUser({name:nickname, socketId:socket.id})
		callback({ isUser:false, user:us})
		let sql = `select * from connection where p1 = "${nickname}" `;
		console.log(sql);
		var old_p1="";
		conn.query(sql, function(err, results) {
			if (err) throw err;
			if(results.length>0){
				
			old_p1 = results[0].p1sid;
			let sql = `update connection set p1sid = "${us.id}" where p1="${nickname}" `;
			console.log(sql);
			conn.query(sql, function(err, results) {
				if (err) throw err;
			});
			/* sql = `update message set sender = "${us.id}" where sender="${old_p1}"`;
			 console.log(sql);
			 conn.query(sql, function(err, results) {
				if (err) throw err;
			});*/
			}
		});
		}
})
	//User Connects with username
>>>>>>> 0678733fe4b8e1a9204c7a5c9d984e4a51f46542
	socket.on(USER_CONNECTED, (user)=>{
		user.socketId = socket.id
		connectedUsers = addUser(connectedUsers, user)
		socket.user = user

		sendMessageToChatFromUser = sendMessageToChat(user.name)
		sendMessageToChatFromOld = sendMessageToOld(user.name)
		sendEndOld = sendFinishOld(user.name)
		sendTypingFromUser = sendTypingToChat(user.name)

		io.emit(USER_CONNECTED, connectedUsers)
		console.log(connectedUsers);

	})
	
	//User disconnects
	socket.on('disconnect', ()=>{
		if("user" in socket){
			connectedUsers = removeUser(connectedUsers, socket.user.name)

			io.emit(USER_DISCONNECTED, connectedUsers)
			console.log("Disconnect", connectedUsers);
		}
	})


	//User logsout
	socket.on(LOGOUT, ()=>{
		connectedUsers = removeUser(connectedUsers, socket.user.name)
		io.emit(USER_DISCONNECTED, connectedUsers)
		console.log("Disconnect", connectedUsers);

	})

	//Get Community Chat
	socket.on(COMMUNITY_CHAT, (callback)=>{
		callback(communityChat)
	})

	socket.on(MESSAGE_SENT, ({chatId, message})=>{
		sendMessageToChatFromUser(chatId, message)
	})

	socket.on(TYPING, ({chatId, isTyping})=>{
		sendTypingFromUser(chatId, isTyping)
	})

	socket.on(PRIVATE_MESSAGE, ({reciever, sender, activeChat})=>{
		if(reciever in connectedUsers){
			const recieverSocket = connectedUsers[reciever].socketId
			if(activeChat === null || activeChat.id === communityChat.id){
				const newChat = createChat({ name:`${reciever}&${sender}`, users:[reciever, sender] })
				socket.to(recieverSocket).emit(PRIVATE_MESSAGE, newChat)
				socket.emit(PRIVATE_MESSAGE, newChat)
				console.log("if đầu, new chat");
				
			}else{
				if(!(reciever in activeChat.users)){
					activeChat.users
										.filter( user => user in connectedUsers)
										.map( user => connectedUsers[user] )
										.map( user => {
											socket.to(user.socketId).emit(NEW_CHAT_USER, { chatId: activeChat.id, newUser: reciever })
										} )
										socket.emit(NEW_CHAT_USER, { chatId: activeChat.id, newUser: reciever } )
										console.log("if 2, new chat user");

				}
				socket.to(recieverSocket).emit(PRIVATE_MESSAGE, activeChat)
				
			}
			
		}
	})

}
/*
* Returns a function that will take a chat id and a boolean isTyping
* and then emit a broadcast to the chat id that the sender is typing
* @param sender {string} username of sender
* @return function(chatId, message)
*/
function sendTypingToChat(user){
	return (chatId, isTyping)=>{
		io.emit(`${TYPING}-${chatId}`, {user, isTyping})
	}
}

/*
* Returns a function that will take a chat id and message
* and then emit a broadcast to the chat id.
* @param sender {string} username of sender
* @return function(chatId, message)
*/
function sendMessageToChat(sender){
	return (chatId, message)=>{
		// let sql = `INSERT INTO message value ('',"${chatId}", "${message}","${sender}")`;
		// console.log(sql);
		// conn.query(sql, function(err, results) {
		// 	if (err) throw err;
		// });
		let sql = "";
		sql = `select * from connection where p1sid = "${chatId}" limit 1`;
		console.log(sql);
		//let sql = `INSERT INTO connection value ('',"${sender}", "${reciever}","${newChat.id}","${recieverSocket}")`;
		console.log(sql);
		conn.query(sql, function(err, results) {
			if (err) throw err;
			results.map((e) => {
				let reciever = (sender === e.p1)? e.p2: e.p1
				sql = `insert connection value ('',"${sender}","${reciever}","${chatId}","${message}")`
				console.log(sql )
				conn.query(sql, function(err, results) {
					if (err) throw err;
				});
				//sendMessageToChat(reciever);
			});
		});
		io.emit(`${MESSAGE_RECIEVED}-${chatId}`, createMessage({message, sender}))
	}
}

/*
* Adds user to list passed in.
* @param userList {Object} Object with key value pairs of users
* @param user {User} the user to added to the list.
* @return userList {Object} Object with key value pairs of Users
*/
function addUser(userList, user){
	let newList = Object.assign({}, userList)
	newList[user.name] = user
	return newList
}

/*
* Removes user from the list passed in.
* @param userList {Object} Object with key value pairs of Users
* @param username {string} name of user to be removed
* @return userList {Object} Object with key value pairs of Users
*/
function removeUser(userList, username){
	let newList = Object.assign({}, userList)
	delete newList[username]
	return newList
}

/*
* Checks if the user is in list passed in.
* @param userList {Object} Object with key value pairs of Users
* @param username {String}
* @return userList {Object} Object with key value pairs of Users
*/
function isUser(userList, username){
  	return username in userList
}
function sendMessageToOld(sender){
	return (chatId, message)=>{
		io.emit(`${OLD_LOADER}-${chatId}`, createMessage({message, sender}))
	}
	
}
function sendFinishOld(sender){
	return (chatId)=>{
		io.emit(`${END_OLD_LOADER}-${chatId}`);
	}
	
}