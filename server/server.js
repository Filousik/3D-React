//*Test*//
import uploadRoutes from "./routes/upload.routes.js"
import express from "express"
import path from "path"
import { fileURLToPath } from "url";
import fs from "fs"
import session from "express-session"
import bcrypt from "bcrypt"
import { writeFile } from "fs/promises";



const app = express();
const port = 1555;
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_PATH = "./cards.json"
const USERS_PATH = "./users.json"

app.listen(port, ()=>{console.log("http://localhost:"+port)});

app.use(express.json());
app.use(session({
  secret: "tomato-potato",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}))

app.use("/uploads", express.static("uploads"))
app.use("/api/upload", uploadRoutes)


app.use(express.static(path.join(__dirname, "../client/dist")));

function loginAuth(req,res,next){
  if (!req.session.user){
    return res.status(401).json({message:"You must be logged in mate"})
  }
  next();
}


function adminAuth(req,res,next){
  if (!req.session.user){
    return res.status(401).json({message:"You must be logged in"});
  }
  if (req.session.user.role !== "admin"){
    return res.status(403).json({message:"Admins only"});
  }
  next();
}
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

async function getUsers(){
  try {


    const data = await fs.promises.readFile(USERS_PATH, "utf-8");
    return JSON.parse(data)

  } catch(err){
    return [];

  }
}
async function saveUsers(users){
    await fs.promises.writeFile(USERS_PATH, JSON.stringify(users,null,2));


}   


app.get("/cards", async (req, res)=>{
  try{
  const cards = await getCards()
  res.json(cards)
  } catch(err){
    res.status(500).json({message: "Failed to delete card"})
  }
 
})

app.delete("/cards/:id",loginAuth, async (req,res)=>{

  try{

    const id = Number(req.params.id)
    let cards = await getCards()

    const card = cards.find(card=>card.id == id);
    if(!card){
      return res.status(404).json({message:"Card not found"});
    }

   const isOwwner = card.ownerId === req.session.user.id;
   const isAdmin = req.session.user.role === "admin";
   if (!isOwwner && !isAdmin ){
    return res.status(403).json({message:"You may only delete your own"});
   }

   if(card.image){
    const imagePath = path.join(__dirname,card.image);
    try{
      await fs.promises.unlink(imagePath);

    }catch(err){
      console.log("Image file not found, skpping:", imagePath)
    }
   } 

   
 


  
  cards = cards.filter(card=>card.id !== id)
  await saveCards(cards)
  res.json({message:"Card deleted"})
  }catch(err){
    res.status(500).json({message:"Failed to delete card"})
  }


  
})


app.get("/users", adminAuth, async (req,res)=>{
const data = await getUsers()
res.json(data)

})


app.post("/auth/register", async (req,res)=>{
  try{
    const {username, password} = req.body;
    if(!username || !password) {
      return res.status(400).json({message:"Username and password required"});

    }
    const users = await getUsers();
    const exists = users.find(u=>u.username == username);
    if(exists){
      return res.status(400).json({message: "Username already taken"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(),
      username,
      password: hashedPassword,
      role: "user"

    };
    users.push(newUser)
    await saveUsers(users)
    res.json({message:"Account created"})


  }catch(err){
    res.status(500).json({message:"Registration failed"});
  }
})


app.post("/auth/login", async (req,res)=>{

  try{
    const {username, password} = req.body
    const users = await getUsers();
    const user = users.find(u=>u.username == username);

    if(!user) {
      return res.status(400).json({message:"Invalid username or password"});
    }
    const match = await bcrypt.compare(password, user.password);
    if(!match){
      return res.status(400).json({message:"Invalid username or passwword"});
    }
    req.session.user = {id: user.id, username: user.username, role: user.role};
    res.json({message:"Logged in", username: user.username, role: user.role});
  }catch(err){
    res.status(500).json({message:"Login failed"})
  }
});

app.post("/auth/logout", (req,res)=>{
  req.session.destroy();
  res.json({message:"Logged out"});

});

app.get("/auth/me", (req,res)=>{
  if (req.session.user){
    res.json(req.session.user);

  } else {
    res.status(401).json({message: "Not logged in"})
  }
})


app.post("/cards", loginAuth, async (req, res) => {
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
    image: image || "",
    ownerId: req.session.user.id,
    ownerName: req.session.user.username
  };
  cards.push(newCard)
  await saveCards(cards)
  res.json(newCard)
  } catch(err){
    res.status(500).json({message:"Failed to save card"})
  }
});



