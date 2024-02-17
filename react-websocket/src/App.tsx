import { Route, Routes } from 'react-router-dom';
import Chatroom from './pages/chat-room/chat-room';
import WaitingRoom from './pages/waiting-room/waiting-room';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<WaitingRoom />} />
      <Route path="/room/:roomName" element={<Chatroom />} />
    </Routes>
  );
};


export default App;