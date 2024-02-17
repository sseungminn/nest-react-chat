import classNames from 'classnames';
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { ws } from '../../App';
import { clientId } from '../waiting-room/waiting-room';
import {
  ChatContainer,
  LeaveButton,
  Message,
  MessageBox,
  MessageForm,
} from './chat-room.styles';

type UserInfo = {
  id: string;
  username: string;
}
interface IChat {
  id: string;
  username: string;
  message: string;
}

const ChatRoom = () => {
  const ws = new WebSocket(`ws://localhost:8787${window.location.pathname}`);
  const [chats, setChats] = useState<IChat[]>([]);
  const [message, setMessage] = useState<string>('');
  const [client, setClient] = useState<UserInfo>({id:'', username:''});
  const chatContainerEl = useRef<HTMLDivElement>(null);
  const userInfo:UserInfo = JSON.parse(localStorage.getItem(`${clientId}`) || `{"id":"", "username":""}`);
  const { roomName } = useParams<'roomName'>();
  const navigate = useNavigate();


  // 채팅이 길어지면(chats.length) 스크롤이 생성되므로, 스크롤의 위치를 최근 메시지에 위치시키기 위함
  useEffect(() => {
    if (!chatContainerEl.current) return;


    const chatContainer = chatContainerEl.current;
    const { scrollHeight, clientHeight } = chatContainer;


    if (scrollHeight > clientHeight) {
      chatContainer.scrollTop = scrollHeight - clientHeight;
    }
  }, [chats.length]);


  // message event listener
  useEffect(() => {
    console.log(ws);
    setClient(userInfo);

    const messageHandler = (event: MessageEvent) => {
      console.log(event);
      const chat: IChat = {id: client.id, username: client.username, message:event.data};
      setChats((prevChats) => [...prevChats, chat]);
    }

    ws.addEventListener('open', event => {
      console.log('chat open!!');
    });
    
    ws.addEventListener('message', event => {
      const chat: IChat = {id: client.id, username: client.username, message};
      console.log('message');
      setChats((prevChats) => [...prevChats, chat]);
    });
    // ws.on('message', messageHandler);


    return () => {
      // ws.removeEventListener('message', messageHandler);
      // ws.off('message', messageHandler);
    };
}, []);


  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  }, []);


  const onSendMessage = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!message) return alert('메시지를 입력해 주세요.');
      if(ws && ws.readyState === WebSocket.OPEN) {
        const chat: IChat = { id: client.id, username: client.username, message };
        // ws.send(JSON.stringify(chat));
        ws.send(JSON.stringify({type:'send-message', event: 'message', data: chat}));
        setChats((prevChats) => [...prevChats, chat]);
        setMessage('');
      }
      // socket.emit('message', { username: userInfo.username, roomName: roomName, message: message }, (chat: IChat) => {
      //   setChats((prevChats) => [...prevChats, chat]);
      // });
    },
    [message, roomName]
  );


  const onLeaveRoom = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const leaveInfo = { roomName, username: client.username };
      ws.send(JSON.stringify({ type:'leave-room', event: 'message', data: {username: client.username, roomName: roomName } }));
    }
    // socket.emit('leave-room', {roomName:roomName, username: userInfo.username}, () => {
      // navigate('/');
    // });
    localStorage.removeItem(`${clientId}`);
  }, [roomName, navigate]);


  return (
    <>
      <h1>Chat Room: {roomName}</h1>
      <LeaveButton onClick={onLeaveRoom}>방 나가기</LeaveButton>
      <ChatContainer ref={chatContainerEl}>
        {chats.map((chat, index) => (
          <MessageBox
            key={index}
            className={classNames({
              my_message: (chat.id === client.id),
              alarm: !chat.username,
            })}
          >
            <span>
              {chat.username}
              {/* {chat.id
                ? client.id === chat.id
                  ? ''
                  : chat.username
                : ''} */}
            </span>
            <Message className="message">{chat.message}</Message>
          </MessageBox>
        ))}
      </ChatContainer>
      <MessageForm onSubmit={onSendMessage}>
        <input type="text" onChange={onChange} value={message} />
        <button>보내기</button>
      </MessageForm>
    </>
  );
};
export default ChatRoom;