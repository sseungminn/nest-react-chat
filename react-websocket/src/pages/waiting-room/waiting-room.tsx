import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Head, Table } from './waiting-room.styles';
import { socket } from '../../App';

interface CreateRoomResponse {
  success: boolean;
  payload: string;
}


const WaitingRoom = () => {
  const [rooms, setRooms] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const roomListHandler = (rooms: string[]) => {
      setRooms(rooms);
    };
    const createRoomHandler = (newRoom: string) => {
      setRooms((prevRooms) => [...prevRooms, newRoom]);
    };
    const deleteRoomHandler = (roomName: string) => {
      setRooms((prevRooms) => prevRooms.filter((room) => room !== roomName));
    };


    socket.emit('room-list', roomListHandler);
    socket.on('create-room', createRoomHandler);
    socket.on('delete-room', deleteRoomHandler);


    return () => {
      socket.off('room-list', roomListHandler);
      socket.off('create-room', createRoomHandler);
      socket.off('delete-room', deleteRoomHandler);
    };
  }, []);


  const onCreateRoom = useCallback(() => {
    const roomName = prompt('생성할 방 이름 입력');
    if (!roomName) return alert('방 이름 입력 필수');

    const username = prompt('닉네임 입력해 주세요.');
    if (!username) return alert('닉 입력해야합니다.');
    localStorage.setItem(`${socket.id}`, JSON.stringify({id:socket.id, username: username}));

    socket.emit('create-room', {roomName: roomName, username: username}, (response: CreateRoomResponse) => {
      if (!response.success) return alert(response.payload);
      navigate(`/room/${response.payload}`);
    });
  }, [navigate]);


  const onJoinRoom = useCallback(
    (roomName: string) => () => {
      const username = prompt('사용할 닉네임 입력');
      if (!username) return alert('닉네임 입력 필수');
      localStorage.setItem(`${socket.id}`, JSON.stringify({id:socket.id, username: username}));

      socket.emit('join-room', {roomName: roomName, username: username}, () => {
        navigate(`/room/${roomName}`);
      });
    },
    [navigate]
  );


  return (
    <>
      <Head>
        <div>채팅방 목록</div>
        <button onClick={onCreateRoom}>채팅방 생성</button>
      </Head>


      <Table>
        <thead>
          <tr>
            <th>방번호</th>
            <th>방이름</th>
            <th>입장</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, index) => (
            <tr key={room}>
              <td>{index + 1}</td>
              <td>{room}</td>
              <td>
                <button onClick={onJoinRoom(room)}>입장하기</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};


export default WaitingRoom;