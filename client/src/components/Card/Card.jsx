
export default function Card ({text, setText}) {
    return(
        <div className='hero container'>
            <div className="hero-text">
                <p>{text}</p>
                <button className='btn' onClick={()=>{setText("Homie")}}>Explore more</button>
                <button className='btn' onClick={()=>{setText("lol")}}>Explore more</button>
            </div>
        
        </div>
    )
}


