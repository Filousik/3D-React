import './App.css'
import Hero from './components/Hero/Hero'
import Card from './components/Card/Card.jsx'
import About from './components/About/About.jsx'
import Home from './components/Home/Home.jsx'
import Upload from './components/Upload/Upload.jsx'

import React, { useEffect, useState } from "react"
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'



function App() {
 const [page, setPage] = useState(0);
 
 

  return (
    <AuthProvider>
    <>
      
      <Header page={page} setPage={setPage}></Header>

      {page == 0 && <Home />}
      {page == 1 && <About />}
      {page == 2 && <Upload/>}
      {page == 3 && <Cards />}
      
      
      <Footer></Footer>
      
    </>
    </AuthProvider>
  )
}

export default App




function Header({page, setPage}){
  const {user, logout} = useAuth();

  const [showModal, setShowModal] = useState(false);

  return(
    <header>
      

      <nav className='container'>
          <img src="" alt="" className='logo' />
          <button className="btn" onClick={()=>setPage(0)}>Home</button>
          <button className="btn" onClick={()=>setPage(1)}>About</button>
          <button className="btn" onClick={()=>setPage(2)}>Upload</button>
          <button className="btn" onClick={()=>setPage(3)}>Cards</button>
          

         {user ? (
          <>
            <span>Hi, {user.username}</span>
            <button className="btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <button className="btn" onClick={() => setShowModal(true)}>
            Sign in/Up
          </button>
        )}
          
          
          

     </nav>
     {showModal && <AuthModal onClose={() => setShowModal(false)} />}


    </header>

)}


function Footer(){
    return(
        <footer>
         <h2>Footer</h2>
        </footer>



    )
}



function Cards(){
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(()=>{
    loadCards();

  },[])

  

  async function loadCards(){
    try {
    const res = await fetch("/cards");
    const data = await res.json();
    setCards(data);

    } catch (err){
      setError("Failed to load cards. Is the server running?");
    } finally {
      setLoading(false);
    }
    
  }

  async function delCards(id){
   
    try{
    const res = await fetch("/cards/"+ id,{
    method: "DELETE"
   })
    const data = await res.json();
    console.log(data);

    setCards(cards.filter(card =>card.id !== id));


    } catch (err) {
      alert("Could not delete card, Try again");
    }
  
    
  }

  if (loading) return <p>Loading cards</p>
  if (error) return <p>{error}</p>;
  
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


