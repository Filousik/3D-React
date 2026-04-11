import './App.css'
import About from './components/About/About.jsx'
import Home from './components/Home/Home.jsx'
import { useState } from "react"
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'
import { CardProvider, useCards } from './context/UploadContext.jsx'
import UploadModal from './components/UploadModal/UploadModal.jsx'
import EditModal from './components/EditModal/EditModal.jsx'
import logo from './assets/3DLIFE.png';




function App() {
 const [page, setPage] = useState(()=>{
  const saved = sessionStorage.getItem("page");
  return saved ? Number(saved) : 0;
 })


 const [showUploadModal, setShowUploadModal] = useState(false);
 const [showModal, setShowModal] = useState(false);

 function handleSetPage(newPage){
  setPage(newPage);
  sessionStorage.setItem("page",newPage);
 }
 
 

  return (
    <AuthProvider>
      <CardProvider>
      <>
        
        <Header page={page}
        setPage={handleSetPage}
        setShowModal={setShowModal}
        setShowUploadModal={setShowUploadModal}></Header>

        {page == 0 && <Home />}
        {page == 1 && <About />}
        {page == 3 && <Cards />}
        
        
        <Footer></Footer>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
        {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
        
      </>
      </CardProvider>
    </AuthProvider>
  )
}

export default App




function Header({page, setPage, setShowModal, setShowUploadModal}){
  const {user, logout} = useAuth();
  
  

  return(
    <header>
      

      <nav className='container'>
          <img onClick={()=>setPage(3)} src={logo} alt="" className='logo' />
          <button className="btn" onClick={()=>setPage(0)}>Home</button>
          <button className="btn" onClick={()=>setPage(1)}>About</button>
          <button className="btn" onClick={()=>setPage(3)}>Cards</button>
          

         {user ? ( /*Om användare finns/aktiv så visas username idiv och logout knapp annars visas modal när man trycker på signin knappen*/
          <>
            <button className="btn" onClick={()=> setShowUploadModal(true)}>Upload</button>
            <button className="btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <button className="btn" onClick={() => setShowModal(true)}>
            Sign in/Up
          </button>
        )}
          
          
          

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



function Cards(){
  const {cards, loading, error, delCard} = useCards();
  const { user } = useAuth();
  const [editingCard, setEditingCard] = useState(null);


  if (loading) return <p>Loading cards</p>
  if (error) return <p> {error} </p>


return (
     <div className="cards-grid">
            {cards.map(card => (
                <div className="Card" key={card.id}>
                    <img src={card.image} alt={`${card.brand} ${card.model}`} />
                    <h3>{card.brand} {card.model}</h3>
                    <p>Year: {card.year}</p>
                    <p>Price: {card.price}</p>
                    <p>Added by {card.ownerName}</p>
                    {user && (user.id == card.ownerId || user.role === "admin") && (
                       <>
                      <button onClick={() => setEditingCard(card)}>Edit</button>
                      <button onClick={() => delCard(card.id)}>Delete</button>
                       
                       </>
                        
                    )}
                </div>
            ))}

        {editingCard && (
          <EditModal
          card={editingCard}
          onClose={()=> setEditingCard(null)}
          />
        )}
        </div>
  )
}


