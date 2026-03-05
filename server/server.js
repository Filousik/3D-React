//*Test*//

const express = require("express");
const app = express();
const path = require("path");
app.use(express.json());

const port = 1555;
app.use(express.static(path.join(__dirname, "../client/dist")));



app.listen(port, ()=>{console.log("http://localhost:"+port)});



const cars = [
  {
    id: "car_001",
    brand: "Toyota",
    model: "Corolla",
    year: 2023,
    price: 23995,
    currency: "USD",
    bodyType: "Sedan",
    fuelType: "Petrol",
    transmission: "Automatic",
    engine: "2.0L I4",
    horsepower: 169,
    mileage: 12000,
    color: "White",
    doors: 4,
    drivetrain: "FWD",
    condition: "Used"
  },
  {
    id: "car_002",
    brand: "Tesla",
    model: "Model 3",
    year: 2024,
    price: 38990,
    currency: "USD",
    bodyType: "Sedan",
    fuelType: "Electric",
    transmission: "Automatic",
    engine: "Dual Motor",
    horsepower: 283,
    mileage: 5000,
    color: "Black",
    doors: 4,
    drivetrain: "AWD",
    condition: "Used"
  },
  {
    id: "car_003",
    brand: "BMW",
    model: "X5",
    year: 2022,
    price: 52900,
    currency: "USD",
    bodyType: "SUV",
    fuelType: "Diesel",
    transmission: "Automatic",
    engine: "3.0L I6",
    horsepower: 335,
    mileage: 22000,
    color: "Blue",
    doors: 5,
    drivetrain: "AWD",
    condition: "Used"
  },
  {
    id: "car_004",
    brand: "Ford",
    model: "Mustang",
    year: 2021,
    price: 45950,
    currency: "USD",
    bodyType: "Coupe",
    fuelType: "Petrol",
    transmission: "Manual",
    engine: "5.0L V8",
    horsepower: 450,
    mileage: 15000,
    color: "Red",
    doors: 2,
    drivetrain: "RWD",
    condition: "Used"
  },
  {
    id: "car_005",
    brand: "Volvo",
    model: "XC60",
    year: 2023,
    price: 46995,
    currency: "USD",
    bodyType: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatic",
    engine: "2.0L I4 Hybrid",
    horsepower: 455,
    mileage: 8000,
    color: "Silver",
    doors: 5,
    drivetrain: "AWD",
    condition: "Used"
  }
];


