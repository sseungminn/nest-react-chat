import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';

interface JoinRoomInfo {
  roomName: string;
  username: string;
}

interface LeaveRoomInfo {
  roomName: string;
  username: string;
}

interface CreateRoomInfo {
  roomName: string;
  username: string;
}

interface MessagePayload {
  username: string;
  roomName: string;
  message: string;
}


let createdRooms: string[] = [];


@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: ['http://localhost:3002'],
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('Gateway');


  @WebSocketServer() nsp: Namespace;


  afterInit() {
    this.nsp.adapter.on('delete-room', (room) => {
      const deletedRoom = createdRooms.find(
        (createdRoom) => createdRoom === room,
      );
      if (!deletedRoom) return;


      this.nsp.emit('delete-room', deletedRoom);
      createdRooms = createdRooms.filter(
        (createdRoom) => createdRoom !== deletedRoom,
      ); // 유저가 생성한 room 목록 중에 삭제되는 room 있으면 제거
    });


    this.logger.log('웹소켓 서버 초기화 ✅');
  }


  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결`);
  }


  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} 소켓 연결 해제 ❌`);
  }


  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { username, roomName, message }: MessagePayload,
  ) {
    socket.broadcast
      .to(roomName)
      .emit('message', { id: socket.id, username: username, message: message });


    return { id: socket.id, username: username, message: message };
  }


  @SubscribeMessage('room-list')
  handleRoomList() {
    return createdRooms;
  }


  @SubscribeMessage('create-room')
  handleCreateRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomInfo: CreateRoomInfo,
  ) {
    const exists = createdRooms.find((createdRoom) => createdRoom === roomInfo.roomName);
    if (exists) {
      return { success: false, payload: `${roomInfo.roomName} 방이 이미 존재합니다.`, username: roomInfo.username};
    }


    socket.join(roomInfo.roomName); // 기존에 없던 room으로 join하면 room이 생성됨
    createdRooms.push(roomInfo.roomName); // 유저가 생성한 room 목록에 추가
    this.nsp.emit('create-room', roomInfo.roomName); // 대기실 방 생성


    return { success: true, payload: roomInfo.roomName, username: roomInfo.username};
  }


  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomInfo: JoinRoomInfo,
  ) {
    socket.join(roomInfo.roomName); // join room
    socket.broadcast
      .to(roomInfo.roomName)
      .emit('message', { message: `${roomInfo.username}님이 들어왔습니다.` });


    return { success: true };
  }


  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomInfo: LeaveRoomInfo,
  ) {
    socket.leave(roomInfo.roomName); // leave room
    socket.broadcast
      .to(roomInfo.roomName)
      .emit('message', { message: `${roomInfo.username}님이 나갔습니다.` });


    return { success: true };
  }
}