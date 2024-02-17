import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Head, Table } from './waiting-room.styles';
// import { ws } from '../../App';
import uuid from 'react-uuid';

interface User {
  websocket: WebSocket;
  id: string;
  city: string | undefined;
  country: string;
}
export const clientId = uuid();


const WaitingRoom = () => {
  const ws = new WebSocket('ws://localhost:8787');
  const [rooms, setRooms] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {

    ws.addEventListener('open', event => {
      console.log('OPEN WebSocket!!');
    });

    ws.addEventListener('message', event => {
      setRooms((prevRooms) => [...prevRooms,event.data]);
    });

    ws.addEventListener('close', event => {
      console.log('WebSocket closed, reconnecting:', event.code, event.reason);
      // rejoin();
    });

    ws.addEventListener('error', event => {
      console.log('WebSocket error, reconnecting:', event);
      // rejoin();
    });
    return () => {
    };
  }, []);


  const onCreateRoom = useCallback(() => {
    const roomName = prompt('생성할 방 이름 입력');
    if (!roomName) return alert('방 이름 입력 필수');

    const username = prompt('닉네임 입력해 주세요.');
    if (!username) return alert('닉 입력해야합니다.');
    localStorage.setItem(`${clientId}`, JSON.stringify({id:clientId, username: username}));
    ws.send(JSON.stringify({type: 'create-room', event: 'message', data: {owner: clientId, roomName: roomName}}));
    navigate(`/room/${roomName}`);
  }, [navigate]);


  const onJoinRoom = useCallback(
    (roomName: string) => () => {
      const username = prompt('사용할 닉네임 입력');
      if (!username) return alert('닉네임 입력 필수');
      localStorage.setItem(`${clientId}`, JSON.stringify({id:clientId, username: username}));

      ws.send(JSON.stringify({type: 'join-room', event: 'message', data: {roomName: roomName, username: username}}));
      navigate(`/room/${roomName}`);
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