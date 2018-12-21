/*
发送一方就是子页面，接收一方就是主页面（不是a就为主页面）

客户端 1.socket.emit('x1') 子页面发送数据 （主页面为id添加）
       4.socket.on('x1') 主页面接收数据  （判断有没有id，id等于主页面就emit ）
	   5.socket.emit('x1') 主页面append(数据到页面)并发送接收到数据给子页面   （拿到子页面ID并添加发送）
       8.socket.on('x1')  子页面接收到主页面接收到信息append到子页面  （判断有没有id，id等于子页面就不emit，反正无限emit,on ）
	   
	  （每个服务端路由和客户端虽然都是一个独有方法，但内容不能都一样，例如不可能都执行console.log，那就没意义了，所以统一通过id来区分服务端和客户端）
	   
服务端 2.socket.on('x1') 子页面接收数据  
       3.socket.to(主).emit('x1') 子页面发送数据给主页面 （拿到主页面id,然后改子页面为ID添加）
	   6.socket.on('x1') 主页面接收到信息 
	   7.socket.to(子).emit('x1') 主页面发送给子页面告诉它接收到结果了  （拿到子页面ID发送给子页面）
   
下面写得太乱了，所以改下思路   
*/
var http = require('http');
var fs = require('fs');
var url = require('url');
var mysql = require('./index.js');

var count = 0;
var Gb_roomIdCount = '';



var server = http.createServer(function (req,res){
	if(req.url.indexOf('/a') === 0){
	   var LcA_json = url.parse(req.url, true).query; 
       var LcA_firstname = LcA_json.firstname;
       var LcA_lastname = LcA_json.lastname;
	   if(LcA_firstname ==='吴章本' && LcA_lastname === '吴章本'){
		  fs.readFile('./index.html',function(error,data){
				res.writeHead(200,{'Content-Type':'text/html'});
				res.end(data,'utf-8');
			});
		   return;
	   }
	   
		res.writeHead(200,{'Content-Type':'text/html;charset=utf8'});
		res.end('<!DOCTYPE html><html><body><form action="/a" method="GET">我叫什么:<br><input type="text" name="firstname"><br>我叫什么:<br><input type="text" name="lastname"><input type="submit" value="提交"></form></body></html>');
		return;
	}
    fs.readFile('./index.html',function(error,data){
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data,'utf-8');
    });
}).listen(3000,"127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');
//socket.io监听网址
var io = require('socket.io').listen(server);
//数据有二进制时可以提高性能
io.binary(true).emit('an event', { some: 'data' });



//sockets是监听然后操作返回callback或者是执行再执行callback，callback是默认执行的（所以执行里的第二个没数据可以不用写），除非你传数据他会执行并返回数据
//connection是当打开网站时执行并返回这个网站内的事件处理者（socket）
io.sockets.on('connection',function(socket){
count++;
var url = socket.request.headers.referer;
  var splited = url.split('/');
  var roomID = splited[splited.length - 1];   // 获取房间ID
if(roomID===''){roomID='/'} //防止根路由为'',导致客户端获取ID后if('')不执行

//用户打开连接执行
socket.emit("open");
socket.join(roomID,()=>{
	 /*let rooms = Object.keys(socket.rooms);
    console.log(rooms);*/
});// 加入房间

    // 通知a房间内人员有人加入房间了，不包括当前，io.to就包括
    socket.to('a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC').emit('sys',  '加入了房间', roomID);
	
	// 通知roomID房间内人员关闭连接,除了当前房间
	
	 socket.to(roomID).emit("checked",{"check":false});
	 
//执行发送给所有用户(broadcast关键字键值,注意：发送方没有执行到users，因为socket排除了当前发送者，而去掉关键字的只查询当前触发的，没有就没有执行，不查询其它的)
 socket.broadcast.emit("users",{"number":count});
//console.log(io.sockets.adapter.rooms.a===undefined)
//执行只发送给当前触发的
 socket.emit('users',{number:count});
 
//监听主或子客户端用户提交文本并发送给子或主房间
    socket.on('message',function(data){
       
        if(data.mainRoom){ //子
		     var roomss = data.mainRoom;
			 //下面两个if对a做处理,防止其他页面能看到特殊a页面
			 if(roomss==='a'){roomss='a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC'}
             if(roomID==='a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC'){roomID='a'} 				 
			//主页面不在时提示没人在给子页面(发送数据方)
			if(io.sockets.adapter.rooms[roomss]===undefined){
				data.text = '暂时没有人在';
				socket.emit('message', data);
				return;
			}
			socket.to(roomss).emit('message', data, roomID);
			
		}
		
		if(data.sonRoom){  //主
		    var roomss = data.sonRoom;
			data.mainRoom = roomID
			//下面两个if对a做处理,防止其他页面能看到特殊a页面
			if(roomID==='a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC'){data.mainRoom='a'};
            if(roomss==='a'){roomss='a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC'};				
			socket.to(roomss).emit('message',  data);
		}

    });
   //监听主或子客户端用户上传文件并发送给子或主房间 
    socket.on('file',function(data){
          	
        if(data.mainRoom){
			var roomss = data.mainRoom;
			 //下面两个if对a做处理,防止其他页面能看到特殊a页面
			 if(roomss==='a'){roomss='a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC'}
             if(roomID==='a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC'){roomID='a'} 				 
			if(io.sockets.adapter.rooms[roomss]===undefined){
				data.text = '暂时没有人在';
				console.log(211);
				socket.emit('message', data);
				return;
			}
			socket.to(roomss).emit('file', data, roomID);
		}
		
		if(data.sonRoom){
			var roomss = data.sonRoom;
			data.mainRoom = roomID
			//下面两个if对a做处理,防止其他页面能看到特殊a页面
			if(roomID==='a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC'){data.mainRoom='a'};
            if(roomss==='a'){roomss='a?firstname=%E5%90%B4%E7%AB%A0%E6%9C%AC&lastname=%E5%90%B4%E7%AB%A0%E6%9C%AC'};				
			socket.to(roomss).emit('file',  data);
		}

    });	

//用户断开连接
 socket.on('disconnect',function(){ 
       socket.leave(roomID);
	   roomID = roomID === "" ? '根目录' : roomID
        count--;
        console.log(`user为 ${roomID} leave`);
        socket.broadcast.emit("users",{number:count,room:roomID});
    });
});
