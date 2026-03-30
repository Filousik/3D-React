import { createContext, useContext, useState, useEffect } from "react";



const AuthContext = createContext();


export function AuthProvider({children}){
    const [user, setUser] = useState(null)

    useEffect(()=>{
        async function checkSession(){
            try{
                const res = await fetch("/auth/me");
                if (res.ok){
                    const data = await res.json();
                    setUser(data);
                }
            }catch(err){
                console.log("No active session")
            }
        }
        checkSession();
    }, [])

    



async function login(username, password) {
    const res = await fetch("/auth/login",{
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setUser(data);
}

async function register(username, password){
    const res = await fetch("/auth/register",{
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username,password})
    });
    const data = await res.json();
    if(!res.ok)throw new Error(data.message);
}

async function logout(){
    await fetch("/auth/logout",{method:"POST"});
    setUser(null);
}


return (
    <AuthContext.Provider value={{user, login, register, logout}}>
        {children}
    </AuthContext.Provider>
);

}

export function useAuth(){
    return useContext(AuthContext);
}
