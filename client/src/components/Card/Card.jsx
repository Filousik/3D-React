
export default function Card ({file}) {
    return(
        <div className="card">
            <img src={file.path} alt="Uploaded file" />
            <p>{file.filename}</p>
        </div>
    )
}


