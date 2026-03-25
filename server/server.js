//*Test*//
import uploadRoutes from "./routes/upload.routes.js"
import express from "express"
import path from "path"
import { fileURLToPath } from "url";
import fs from "fs"



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

async function getCards(){
  try{
  const data = await fs.promises.readFile(DATA_PATH)
  return JSON.parse(data)
  } catch (err){
    //Om filen inte finns returneras tom array
    return [];
  }
  
}

async function saveCards(cards){
  await fs.promises.writeFile(DATA_PATH, JSON.stringify(cards, null, 2))
}


app.get("/cards", async (req, res)=>{
  try{
  const cards = await getCards()
  res.json(cards)
  } catch(err){
    res.status(500).json({message: "Failed to delete card"})
  }
 
})

app.delete("/cards/:id", async (req,res)=>{
  const id = Number(req.params.id)
  let cards = await getCards()
  cards = cards.filter(card=>card.id !== id)
  await saveCards(cards)
  res.json({message:"Card deleted"})
})




app.post("/cards", async (req, res) => {
  try{
    const {brand, model, year, price, image} = req.body;

    if(!brand|| !model || !year || !price){
      return res.status(400).json({message:"Missing required fields"});
    }
  


  const cards = await getCards()
  const newCard = {
    id: Date.now(),
    brand, 
    model, 
    year: Number(year),
    price: Number(price), 
    image: image || ""
  };
  cards.push(newCard)
  await saveCards(cards)
  res.json(newCard)
  } catch(err){
    res.status(500).json({message:"Failed to save card"})
  }
});