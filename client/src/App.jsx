import './App.css'
import Hero from './components/Hero/Hero'
import Card from './components/Card/Card.jsx'
import About from './components/About/About.jsx'
import Home from './components/Home/Home.jsx'
import Upload from './components/Upload/Upload.jsx'

import React, { useEffect, useState } from "react"



function App() {
 const [page, setPage] = useState(0);
 
 

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


function Cars(){
  useEffect(()=>{
    getCars();

  },[])

  const [cars, setCars] = useState(0);

  async function getCars(){
    const res = await fetch("/cars");
    const data = await res.json();
    setCars(data);
  }


  return(
    <div>
      <h2>Cars</h2>
      (JSON.stringify{cars})
    </div>
  )
}