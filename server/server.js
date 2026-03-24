//*Test*//
import uploadRoutes from "./routes/upload.routes.js"
import express from "express"
import path from "path"
import { fileURLToPath } from "url";
import fs from "fs"
import { json } from "stream/consumers";


const app = express();
const port = 1555;
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_PATH = "./cards.json"

app.listen(port, ()=>{console.log("http://localhost:"+port)});

app.use(express.json());

app.use("/uploads", express.static("uploads"))
app.use("/api/upload", uploadRoutes)


app.use(express.static(path.join(__dirname, "../client/dist")));

function getCards(){
  const data = fs.readFileSync(DATA_PATH)
  return JSON.parse(data)
}

function saveCards(cards){
  fs.writeFileSync(DATA_PATH, JSON.stringify(cards, null, 2))
}


app.get("/cards", (req, res)=>{
  const cards = getCards()
  res.json(cards)

})

app.delete("/cards/:id", (req,res)=>{
  const id = Number(req.params.id)
  let cards = getCards()
  cards = cards.filter(card=>card.id !== id)
  saveCards(cards)
  res.json({message:"Card deleted"})
})




app.post("/cards", (req, res) => {
  const cards = getCards()
  const newCard = {
    id: Date.now(),
    brand: req.body.brand,
    model: req.body.model,
    year: Number(req.body.year),
    price: req.body.price,
    image: req.body.image
  }
  cards.push(newCard)
  saveCards(cards)
  res.json(newCard)
})