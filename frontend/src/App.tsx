
import './App.css'
import { Routes, Route } from 'react-router-dom';
import SignUpForm from './pages/Signup';
import Home from './pages/Home';
import PrivateRoute from './routes/privateRoute';

function App() {


  return (
    <Routes>
        <Route path='/' element={<SignUpForm/>} />
        <Route path='/home' element={<PrivateRoute><Home/></PrivateRoute>}/>
      </Routes>
  )
}

export default App
