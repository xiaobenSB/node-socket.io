//socket是的好处是实时监听触发的，你干了什么它就能立刻监听到
//注意别在关键字监听的时间使用emit绑定事件,因为其它用户一旦有监听到这个关键字的，他就会监听一次绑定一个emit的事件，然后emit事件那个就会连续触发的几次
//(因为除了broadcast关键字才会发送给所以有监听到broadcast关键字的事件 才能进行实时更新数据)

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
//用户打开连接执行
socket.emit("open");
//执行发送给所有用户(broadcast关键字键值,注意：发送方没有执行到users，因为socket排除了当前发送者，而去掉关键字的只查询当前触发的，没有就没有执行，不查询其它的)
 socket.broadcast.emit("users",{"number":count});
//执行只发送给当前触发的
 socket.emit('users',{number:count});
//监听用户输入信息
    socket.on('message',function(data){
        socket.broadcast.emit('push message',data);//这里也用到了所有，所以发送信息那方是开启

    });
//用户断开连接
 socket.on('disconnect',function(){ 
        count--;
        console.log('user disconnected');
        socket.broadcast.emit("users",{number:count});
    });
});
