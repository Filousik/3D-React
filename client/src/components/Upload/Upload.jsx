import React, { useState } from "react"

function Upload() {
  const [file, setFile] = useState(null)
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [price, setPrice] = useState("")

  function handleFileChange(e){
    setFile(e.target.files[0])
  }

  async function handleUpload(){

    if(!file){
      alert("Select a file first")
      return
    }

    
    const formData = new FormData()
    formData.append("image", file) 

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    })

    const data = await res.json()

    if(!data.image){
      alert("Upload failed")
      return
    }

    await fetch("/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand,
        model,
        year,
        price,
        image: data.image 
      })
    })

    alert("Card created successfully!")
  
    setFile(null)
    setBrand("")
    setModel("")
    setYear("")
    setPrice("")
  }

  return (
    <div>
      <h2>Create Card</h2>

      <input 
        placeholder="Brand" 
        value={brand} 
        onChange={e => setBrand(e.target.value)} 
      />
      <input 
        placeholder="Model" 
        value={model} 
        onChange={e => setModel(e.target.value)} 
      />
      <input 
        placeholder="Year" 
        value={year} 
        onChange={e => setYear(e.target.value)} 
      />
      <input 
        placeholder="Price" 
        value={price} 
        onChange={e => setPrice(e.target.value)} 
      />

      <input type="file" onChange={handleFileChange} />

      <button onClick={handleUpload}>
        Upload & Create Card
      </button>
    </div>
  )
}

export default Upload