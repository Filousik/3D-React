import './App.css'
import Hero from './components/Hero/Hero'
import Navbar from './components/Navbar/Navbar'
import Card from './components/Card/Card.jsx'

function App() {

  return (
    <>
      
      <Navbar></Navbar>
      <Hero></Hero>
      <Card theText={"nibba"}></Card>
    </>
  )
}

export default App
