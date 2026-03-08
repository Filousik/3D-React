import './App.css'
import Hero from './components/Hero/Hero'
import Card from './components/Card/Card.jsx'
import About from './components/About/About.jsx'
import Home from './components/Home/Home.jsx'
import Upload from './components/Upload/Upload.jsx'

import React, { useState } from "react"



function App() {
 const [page, setPage] = useState(0);
 const [cards, setCards] = useState([]);

 

  return (
    <>
      
      <Header page={page} setPage={setPage}></Header>

      {page === 0 && <Home />}
      {page === 1 && <About />}
      {page === 2 && <Upload/>}
      
      <Footer></Footer>
      
    </>
  )
}

export default App
function Button({page, onClick}){
  return(
    <button onClick={onClick}className="btn">Next page</button>
  )
}




function Header({page, setPage}){
  return(
    <header>
      

      <nav className='container'>
          <img src="" alt="" className='logo' />
          <button className="btn" onClick={()=>setPage(0)}>Home</button>
          <button className="btn" onClick={()=>setPage(1)}>About</button>
          <button className="btn" onClick={()=>setPage(2)}>Upload</button>
          
          
          
          

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
    <div className="empty"></div>
  )
}


