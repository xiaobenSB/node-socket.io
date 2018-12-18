# node-socket.io
简单的实时通讯

//多个房间
 io.to(roomID).to('a').emit('push message',data,roomID);

socket.io上传图片

标志：'二进制'
指定发出的数据中是否存在二进制数据。指定时提高性能。可以是true或false。

io.binary（false）.emit（'an event'，{ some：'data' }）;


 var file = document.getElementById('file');
                    file.onchange = function () {
					 var fd = new FormData();
					 fd.append('myfile', this.files[0]);
					 socket.emit("file",{"file":this.files[0]});    
           //就这样就可以把blob发送给服务器了，不像ajax要new FormData那个方法包装一下，可能socket里对发送的数据处理了
					}
          
服务器端

 socket.on('file',function(data){
		 io.to(roomID).emit('push message',data);   //这样就可以接受Blob数据并发送blob数据给roomID房间里的人了
	 });


然后前端接受并显示
 socket.on('push message', function (data) {
let blob = new Blob([data.file], { type: 'video/*' })
        document.getElementById('img').src = URL.createObjectURL(blob);
        
        }）;
