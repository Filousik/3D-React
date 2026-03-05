import './App.css'
import Hero from './components/Hero/Hero'
import Card from './components/Card/Card.jsx'
import React, { useState } from "react"



function App() {
  const [page, setPage] = useState(0);

  function handleClick(){
    setPage(page + 1);
  }

  return (
    <>
      
      <Header></Header>
      <Empty></Empty>
      <Footer></Footer>
      
    </>
  )
}

export default App
function Button({page, onClick}){
  return(
    <button onClick={onClick}class="btn">Next page</button>
  )
}




function Header(){
  return(
    <header>
      

      <nav className='container'>
          <img src="" alt="" className='logo' />
          <a class="btn"href="">Home</a>
          <a class="btn"href="">About</a>
          <a class="btn"href="">Register</a>
          <a class="btn"href="">Login</a>
          
          

     </nav>

    </header>

)}


function Footer(){
    return(
        <footer>
         <h2>Footer</h2>
        </footer>



    )
}


function Empty(){

  return(
    <div class="empty"></div>
  )
}


