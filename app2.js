//第二个node-socket.io 新增了用户加入不同的房间，当前房间的信息只发送到当前房间里的 ，io.to(x).emit（x）是发送到指定房间里的所有人也包括自己
//用了截取当前访问的网址路径，已确保路径不同时房间不同，如果用count时刷新会跟最后一个打开的count一样，导致房间也一样

var http = require('http');
var fs = require('fs');
var count = 0;
var server = http.createServer(function (req,res){
    fs.readFile('./index.html',function(error,data){
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data,'utf-8');
    });
}).listen(3000,"127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');
//socket.io监听网址
var io = require('socket.io').listen(server);

//sockets是监听然后操作返回callback或者是执行再执行callback，callback是默认执行的（所以执行里的第二个没数据可以不用写），除非你传数据他会执行并返回数据
//connection是当打开网站时执行并返回这个网站内的事件处理者（socket）
io.sockets.on('connection',function(socket){
count++;
var url = socket.request.headers.referer;
  var splited = url.split('/');
  var roomID = splited[splited.length - 1];   // 获取房间ID

//用户打开连接执行
socket.emit("open");
socket.join(roomID);// 加入房间
   
    // 通知roomID房间内所有人员
    io.to(roomID).emit('sys',  '加入了房间', roomID);
	
//执行发送给所有用户(broadcast关键字键值,注意：发送方没有执行到users，因为socket排除了当前发送者，而去掉关键字的只查询当前触发的，没有就没有执行，不查询其它的)
 socket.broadcast.emit("users",{"number":count});
 
//执行只发送给当前触发的
 socket.emit('users',{number:count});
//监听用户输入信息
    socket.on('message',function(data){
        io.to(roomID).emit('push message',data);//这里也用到了所有roomID，包括当前

    });
//用户断开连接
 socket.on('disconnect',function(){ 
       socket.leave(roomID);
	   roomID = roomID === "" ? '根目录' : roomID
        count--;
        console.log(`user为 ${roomID} leave`);
        socket.broadcast.emit("users",{number:count});
    });
});
