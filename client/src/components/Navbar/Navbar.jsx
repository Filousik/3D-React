import React from 'react';
import './Navbar.css'
import logo from '../../assests/logo.jpg'


const Navbar = () => {
    return (
        <nav className='container'>
            <img src={logo} alt="" className='logo' />
            <ul>
                <li>Home</li>
                <li>About</li>
                <li>3D Models</li>
                <li>Nothing</li>
                <li><button className='btn'>Contact us</button></li>
            </ul>

        </nav>
    )
}
export default Navbar