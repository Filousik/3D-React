import { createContext, useContext, useState, useEffect } from "react";



const UploadContext = createContext();

export function CardProvider({childdren}){
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
}