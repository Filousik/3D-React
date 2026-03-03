
import './Card.css'
export default function Card ({text, setText}) {
    return(
        <div className='hero container'>
            <div className="hero-text">
                <h1>We ensure better markets for 3D modellers  gr</h1>
                <p>{text}</p>
                <p>Our cutting-edge bullshitting about 3D modelling and marketing is designed to empower students with nothing, except depression.</p>
                <button className='btn' onClick={()=>{setText("Homie")}}>Explore more</button>
                <button className='btn' onClick={()=>{setText("lol")}}>Explore more</button>
            </div>
        
        </div>
    )
}


