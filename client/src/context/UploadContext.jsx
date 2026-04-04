import { createContext, useContext, useState, useEffect } from "react";
import {useAuth} from "./AuthContext";



const UploadContext = createContext();

export function CardProvider({children}){
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {user} = useAuth();

    useEffect(()=>{
        loadCards();
    }, [user]);





async function loadCards(){
    try{
        const res = await fetch("/cards");
        const data = await res.json();
        setCards(data);
    }catch(err){
        setError("Cards could not load.")
    }finally{
        setLoading(false)
    }
}



async function addCard(brand, model, year, price, image){
    let imagePath = "";
    if (image) {
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await fetch("/api/upload",{
            method:"POST",
            body: formData
            
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();
        imagePath = uploadData.image;

    }

    const res = await fetch("/cards",{
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({brand, model, year, price, image:imagePath})
    });
    if (!res.ok){
        const data = await res.json();
        throw new Error(data.message);
    }
    const newCard = await res.json();
    setCards(prev => [...prev, newCard]);
    return newCard;
}

async function updateCard(id, brand, model, year, price, image){
    let imagePath = null; // Om ingen bild laddas up ändra inte//
    

    if (image && typeof image !== "string"){
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await fetch("/api/upload",{
            method:"POST",
            body: formData
        });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const uploadData = await uploadRes.json();
        imagePath = uploadData.image;
    }

    const res = await fetch("/cards/"+ id,{
        method:"PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            brand,
            model,
            year,
            price,
            image: imagePath || undefined
    })
});


    const updatedCard = await res.json();
    setCards(prev=>prev.map(c=>c.id == id ? updatedCard : c));
    return updatedCard;

}

async function delCard(id){
    const res = await fetch("/cards/"+id, {method:"DELETE"});
    if (!res.ok){
        const data = await res.json();
        throw new Error(data.message)
    }
    setCards(prev => prev.filter(card => card.id !== id));
}
return(
    <UploadContext.Provider value={{cards,loading,error,addCard,delCard, updateCard}}>
        {children}
    </UploadContext.Provider>
);
}

export function useCards(){
    return useContext(UploadContext);
}

   