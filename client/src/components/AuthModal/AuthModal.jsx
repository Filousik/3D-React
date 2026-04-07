
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./AuthModal.css";


export default function AuthModal({onClose}){

    const [tab, setTab] = useState("login");

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const {login, register} = useAuth();

    async function handleSubmit(){
        setError(null);
        setLoading(true);

        try{
            if (tab == "login"){

                await login(username, password);

            } else{
                await register(username, password);
                await login(username, password);
            }

            onClose();    

        }catch(err){
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

    function handleEnter(e){
        if (e.key == "Enter") handleSubmit();
    }
    return(
         <div className="modal-overlay" onClick={onClose}>

      {/*StopPropagation hindrar en från att klicka bort modal och klickar på den*/}
      <div className="modal" onClick={e => e.stopPropagation()}>

        
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Login Register tabbarna */}
        <div className="modal-tabs">
          <button
            className={tab == "login" ? "active" : ""}
            onClick={() => {
              setTab("login");
              setError(null); //Nollställer error vid tabbswitch
            }}
          >Login</button>
          <button
            className={tab == "register" ? "active" : ""}
            onClick={() => {
              setTab("register");
              setError(null); 
            }}
          >Register</button>
        </div>

        
        <h2>{tab == "login" ? "Welcome" : "Create account"}</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={handleEnter}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleEnter}
        />

        

        <button
          className="btn modal-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
        {tab == "login" ? "Login":"Register"}  
        </button>

      </div>
    </div>
  )
}
        
    


