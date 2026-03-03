import Card from '../Card/Card.jsx'
import React, { useState } from "react"
import './Hero.css'




export default function Hero(){
    const [text, setText] = useState("57");
    function changeText(Banana){
        setText(Banana)
    }
    return(
        <div className='hero container'>
            <div className="hero-text">
                <h1>We ensure better markets for 3D modellers</h1>
                <p>Our cutting-edge bullshitting about 3D modelling and marketing is designed to empower students with nothing, except depression.</p>
                <button className='btn' onClick={changeText}>Explore more</button>

                <p>Under här är card</p>
                <Card text={text} setText={changeText}></Card>
            </div>
        
        </div>
    )
}


