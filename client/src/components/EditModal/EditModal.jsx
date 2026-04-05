
import { useState } from "react";
import { useCards } from "../../context/UploadContext";
import "../UploadModal.css";

export default function EditModal({ card, onClose }) {
    
    const [brand, setBrand] = useState(card.brand);
    const [model, setModel] = useState(card.model);
    const [year, setYear] = useState(card.year);
    const [price, setPrice] = useState(card.price);
    const [image, setImage] = useState(null); 
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { updateCard } = useCards();

    async function handleSubmit() {
        setError(null);

        if (!brand || !model || !year || !price) {
            setError("All fields are required");
            return;
        }

        setLoading(true);
        try {
            await updateCard(card.id, brand, model, year, price, image);
            onClose();
        } catch(err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleEnter(e) {
        if (e.key === "Enter") handleSubmit();
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>

                <button className="modal-close" onClick={onClose}>✕</button>
                <h2>Edit card</h2>

                <input
                    type="text"
                    placeholder="Brand"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    onKeyDown={handleEnter}
                />
                <input
                    type="text"
                    placeholder="Model"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    onKeyDown={handleEnter}
                />
                <input
                    type="number"
                    placeholder="Year"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    onKeyDown={handleEnter}
                />
                <input
                    type="number"
                    placeholder="Price"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    onKeyDown={handleEnter}
                />

               
                {card.image && (
                    <div>
                        <p className="Cimage">Current image:</p>
                        <img
                            src={card.image}
                            alt="current"
                            style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px" }}
                        />
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    onChange={e => setImage(e.target.files[0])}
                />
                

                {error && <p className="modal-error">{error}</p>}

                <button
                    className="btn modal-submit"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save changes"}
                </button>

            </div>
        </div>
    )
}