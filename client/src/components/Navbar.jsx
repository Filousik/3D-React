import React from 'react';
import './Navbar.css'
import Image1 from '../../assests/Image1.jpg'


const Navbar = () => {
    return (
        <nav>
            <img src="{Image1}" alt="" />
            <ul>
                <li>Home</li>
                <li>About</li>
                <li>3D Models</li>
                <li>Nothing</li>
                <li>Contacts</li>
            </ul>

        </nav>
    )
}
export default Navbar