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
      {page === 3 && <Cards />}
      
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
          <button className="btn" onClick={()=>setPage(3)}>Cards</button>
          
          
          

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


function Cards(){
  useEffect(()=>{
    loadCards();

  },[])

  const [cards, setCards] = useState([]);

  async function loadCards(){
    const res = await fetch("/cards");
    const data = await res.json();
    setCards(data);
  }

  async function delCards(id){
   
   const res = await fetch("/cards/"+ id,{
    method: "DELETE"
   })
    const data = await res.json()
    console.log(data)

    setCards(cards.filter(card =>card.id !== id))
    
  }
  
  return(
    
    <div>

      {cards.map(card => (
        <div className="Card" key={card.id}>
          <h3>{card.brand} {card.model}</h3>
          <p>Year: {card.year}</p>
          <p>Price: {card.price}</p>
          <img src={card.image} />
          <button onClick={()=>{delCards(card.id)}}>Delete</button>
        </div>
      ))}

    </div>
  )
}
//https://www.youtube.com/watch?v=g8qhF_ggm30 20:38//
//https://www.youtube.com/watch?v=YohZoBB0Bwk