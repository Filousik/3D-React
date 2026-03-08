import React, { useState } from "react"

function Upload() {

  const [file, setFile] = useState(null)

  function handleFileChange(e){
    setFile(e.target.files[0])
  }

  async function handleUpload(){

    if(!file){
      alert("Select a file first")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    })

    const data = await res.json()

    console.log(data)

    alert("Uploaded: " + data.filename)
  }

  return (
    <div>

      <h2>Upload File</h2>

      <input type="file" onChange={handleFileChange} />

      <button onClick={handleUpload}>
        Upload
      </button>

    </div>
  )
}

export default Upload