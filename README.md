# 3D-React
GA



# Backend

## server.js
server.js är min huvudfil inom backend. Den ansvarar för att starta min express-server, konfigurera middleware, API-rutter samt hanterar användares autentisering och data lagring. 
Datan i mitt projekt sparas i json filer då det var simplare att sätta upp och tänkte senare byta ut till en databas som t.ex MySQL. 



## Konfiguration för server start

```js

const app = express();
const port = 1555;
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_PATH = "./cards.json"
const USERS_PATH = "./users.json"

app.listen(port, ()=>{console.log("http://localhost:"+port)});
```

Servern startas på porten 1555. På grund av att jag använder ES-moduler alltså "import" istället för require så måste jag återskapa __filename och __dirname då de inte finns automatiskt med. DATA_PATH och USERS_PATH är konstanter för filsökvägarna för mina json filer för att enkelt använda de vid behov.


## Middleware & Session hantering
```js
app.use(express.json());
app.use(session({
  secret: "tomato-potato",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}))
```
express.json aktiverar parsing av JSON-data i requests. Det är en inbyggt middleware i express och läser request body, om body har JSON konvertrar den det till javascript objekt, därefter sparas den parsade data i req.body för lättare åtkomst via t.ex routes som använder POST. session() sätter up sessionshantering, secret bör vara hemlig, resave sparar inte om session inte har ändrats och saveUninitialized sparar inte tomma sessioner. cookie är antingen secure (HTTPS) eller som i detta fall false för (HTTP).



```js
app.use("/uploads", express.static("uploads"))
app.use("/api/upload", uploadRoutes)
app.use(express.static(path.join(__dirname, "../client/dist")));
```
Ett par middlewares till som respektive gör uploads mappen publik så klienter kan komma åt det, kopplar alla routes som börjar med /api/upload till konstanten uploadRoutes vilket är kopplat till importen av min upload.routes.js fil. Vilket ger tydligare struktur i koden. Sista raden är viktig då den tillåter min server skicka frontend filer som html, css och js. Via en absolut filsökväg till min frontend. Används när jag utför kommandot för Vite npm run watch-build för att frontend ska uppdateras automatiskt när filer ändras. (dist - index.html - assets - index.css, index.js)

## Autentiserings Middleware

### loginAuth

```js
function loginAuth(req,res,next){
  if (!req.session.user){
    return res.status(401).json({message:"You must be logged in mate"})
  }
  next();
}
```
loginAuth skyddar rutter genom att kräva inloggning. Den kontrollerar om `req.session.user` finns annars returnerar den en statuskod 401 ( inte inloggad) och requesten stoppas. Däremot om användaren anses vara inloggad så anropas next() funktionen vilket skickar klientens request vidare till rutten.
### admin auth
```js
function adminAuth(req,res,next){
  if (!req.session.user){
    return res.status(401).json({message:"You must be logged in"});
  }
  if (req.session.user.role !== "admin"){
    return res.status(403).json({message:"Admins only"});
  }
  next();
}
```

Till skillnad från loginAuth skyddar adminAuth rutter genom att kräva både inloggning och admin rollen i användarens data. Admin rollen sätts manuellt i users.json filen. Om man inte är inloggad som user och försöker requesta rutten som har adminAuth så kommer meddelandet "You must be logged in" visas. Om man är inloggad som user kommer däremot meddelandet "Admins only" visas. Bara inloggade konton med rollen admin skickas vidare med next() funktionen till rutten.


## Datahantering JSON


### Hämta cards

```js
async function getCards(){
  try{
  const data = await fs.promises.readFile(DATA_PATH)
  return JSON.parse(data)
  } catch (err){
    //Om filen inte finns returneras tom array
    return [];
  }
  
}
```
Jag använder fs promises för att kunna köra funktioner asynkront för servern inte ska haka upp sig på en sak. Jag vill att flera funktioner kan köras i bakgrunden utan problem. Därför använder jag async och fs promises och await för att servern ska vänta i detta fallet tills filen är uppläst och promise används för att hantera asynkrona operationer och returnerar ett resultat i framtiden. Jag använder try and catch för att om det blir fel och filen inte finns så returnas tom array för att inte krascha servern.


### Spara cards
```js
async function saveCards(cards){
  await fs.promises.writeFile(DATA_PATH, JSON.stringify(cards, null, 2))
}
```
saveCards är en asynkron funktion och när man anropar den så skickar man in cards vilket är en array. Await gör att funktioner väntar tills att filen har skrivits till DATA_PATH som i detta fall är cards.json vilket definieras högst upp i server.js. Därefter konverterar JSON.stringify det från Javascript objektet till string alltså text -> fs.promises.writeFile skriver strängen till cards.json om den redan finns skrivs den över annars skapas den.


### Hämta users
```js
async function getUsers(){
  try {


    const data = await fs.promises.readFile(USERS_PATH, "utf-8");
    return JSON.parse(data)

  } catch(err){
    return [];

  }
}

```
getUsers är en asynkron funktion som försöker att läsa USERS_PATH (users.json), funktionen väntar tills filen är läst innan den fortsätter till att returnera datan som parsas. Om t.ex filen inte finns så returneras en tom array.

### Spara users

```js
async function saveUsers(users){
    await fs.promises.writeFile(USERS_PATH, JSON.stringify(users,null,2));
}   
```
Den här asynkrona funktionen gör samma sak som saveCards() fast arrayen man skickar in i den ses som users och datan skrivs i USERS_PATH alltså (users.json).



## Routes 

### Get cards route
```js
app.get("/cards", async (req, res)=>{
  try{
  const cards = await getCards()
  res.json(cards)
  } catch(err){
    res.status(500).json({message: "Failed to delete card"})
  }
 
})
```
Denna Get route försöker hämta cards arrayen från cards.json via getCards funktionen och när datan har hämtats skickas det tillbaka som JSON och vid fel returneras statuskod 500 vilket innebär att webbservern drabbats av ett oväntat problem och kan inte specificera vad som är fel.


### Delete Route
```js
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
```
Delete routen är skyddad av loginAuth funktion samt är asynkron och använder try and catch för att stoppa om det blir fel. Till att börja med hämtas konstanten id och gör det till integer om det in redan är det från url (req.params.id), därefter hämtas json datan med getCards funktionen. Vi gör en konstant som är kortet med id:et från urlen genom att filtrera med find funktion och om den inte finns/ inte är sann så returneras ett status meddelande 404 om att kortet inte hittades. Därefter skapas konstanterna IsOwwner och isAdmin, isOwwner för att kolla om kortet har samma ägarid som nuvarande inloggad användare och isAdmin kollar om användaren har admin rollen. Om användaren INTE är ägare OCH INTE är admin. Om användaren äger eller är admin -> Fortsätter funktionen, Om användaren varken äger eller är admin -> returneras status meddelandet 403(att det är förbjudet) med meddelandet.


```js
   if(card.image){
    const imagePath = path.join(__dirname,card.image);
    try{
      await fs.promises.unlink(imagePath);

    }catch(err){
      console.log("Image file not found", imagePath)
    }
   } 
  cards = cards.filter(card=>card.id !== id)
  await saveCards(cards)
  res.json({message:"Card deleted"})
  }catch(err){
    res.status(500).json({message:"Failed to delete card"})
  } 
})
```
Därefter om card.image finns alltså filvägen till bilden i uploads mappen t.ex("uploads/img.png) så skapar vi filvägen med path.join(__dirname, card.image) då dirname är mappen där serverfilen ligger och card.image den relativa sökvägen till bilden som sagt. Efter det används try and catch för att först med await vänta tills unlink har tagit bort filen med filvägen. Om det blir fel då den redan är borttagen eller aldrig fanns så loggas felet. Sen skapas en ny array med alla cards förutom den som hade det filtrerade id. Sedan väntar funktionen tills arrayen har sparats med saveCards och skickar tillbaka json meddelandet att kortet tagits bort. Återigen om det blir fel på att ta bort det så fångas felet och statusmeddelande 500 skickas vilket betyder att det är internt server fel eller att servern stött på oväntat fel.


### Get users route
```js
app.get("/users", adminAuth, async (req,res)=>{
const data = await getUsers()
res.json(data)

})

```
Get routen /users hämtar users arrayen från users.json via getUsers funktionen. Även denna route väntar tills data har lästs in då det är await framför och asynkront, därefter skickas tillbaka datan till klienten i JSON format.

## Authentication Routes

### Register Route
```js

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
```
Register är en asynkron post route vilket används för registrera en ny användare. Först hämtas username och password från klienten via req.body.
Sen valideras det om båda fälten finns annars returneras ett fel statuskod 400 (klientfel/felaktigt syntax) med meddelandet att Username och password är required.
Efter den if satsen definieras konstanterna users genom att anropa getUsers och därefter definiera konstanten exists vilket kollar om det specifika användarnamnet redan existerar och om det redan existerar i users.json skickas status 400 med meddelandet att Username already taken. Efter skapas konstant där bcrypt används för att salta lösenordet alltså körs algoritmen för att kryptera 2^10 gånger för att hindra folk från att bruteforca lösenord. Koden väntar tills lösenordet är färdig haschat då det är asynkront. newUser skapas sen med id som genereras med Date.now, användarnamnet, det hashade lösenordet och user role vilket är standard rollen.
Till sist pushas den nya användaren till users listan och saveUsers körs för att skriva den nya users.json med användaren som registrerade sig och Json meddelande skickas om det skapats. Ifall det går fel så skickas en status 500 kod.


```js

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
    res.json({message:"Logged in", id: user.id, username: user.username, role: user.role});
  }catch(err){
    res.status(500).json({message:"Login failed"})
  }
});
```
Asynkron POST route för login, använder try/catch för felhantering. Tar emot username, password från req.body (skickat från klienten), Hämtar alla användare med getUsers och väntar tills datan är inläst. Kontrollerar om användarnamnet finns i users.json annars returneras statuskod 400 med meddelande. Om användarnamnet matchar så jämför den lösenord med det hashade lösenordet och loggar in dig genom spara användarinformationen i sessionen ditt id, username och role.  Skickar också tillbaka användar data i JSON som bekräftelse. Om något går fel returneras det internt serverfel status 500.

### Logout Route

```js
app.post("/auth/logout", (req,res)=>{
  req.session.destroy((err)=>{
    if (err){
      return res.status(500).json({message:"Logout failed"})
    }
    res.json({message:"Logged out"}); 
  });
  });
```
Logout routen är en POST route som används för att förstöra användarens session och returnerar ett json meddelande som bekräftelse.Den använder en callback funktion som körs när den asynkrona operationen req.session.destroy() är klar- Callbacken tar emot err argument som innehåller det eventuella felet. Om ett fel uppstår returneras statuskod 500 för att hantera felet och hindra servern från att krascha.  

### Inloggnings check Route
```js
app.get("/auth/me", (req,res)=>{
  if (req.session.user){
    res.json(req.session.user);

  } else {
    res.status(401).json({message: "Not logged in"})
  }
})
```
Detta är en GET-route som hämtar den aktuellt inloggade användaren via sessionen. Om det finns en aktuell användare skickas användarens information tillbaka som JSON. annars statuskod 401(unauthorized) med meddelandet. Behövs inte skyddas med loginAuth eller adminAuth för den gör en egen koll.

```js
app.patch("/cards/:id", loginAuth, async (req,res)=>{
  try{
    const id = Number(req.params.id);
    let cards = await getCards();

    const card = cards.find(card=> card.id == id);
    if (!card) {
      return res.status(404).json({message:"Card not found"});
    }
    const isOwner = card.ownerId === req.session.user.id
    const isAdmin = req.session.user.role == "admin";
    if (!isOwner && !isAdmin){
      return res.status(403).json({message: "You may only edit your own card"});
    }

    const { brand, model, year, price, image } = req.body;

    if (image && card.image && image !== card.image) {
    const oldImagePath = path.join(__dirname, card.image);
    try {
        await fs.promises.unlink(oldImagePath);
    } catch (err) {
        console.log("Old image not found", oldImagePath);
    }
}

    if (brand) card.brand = brand;
    if (model) card.model = model;
    if (year) card.year = Number(year);
    if (price) card.price = Number(price);
    if (image) card.image = image;

    cards = cards.map(c => c.id == id ? card : c);
    await saveCards(cards);
    res.json(card)
  }catch(err){
    res.status(500).json({message: "Failed to update"})
  }
});
```
PATCH route används när man ska delvis uppdatera något, här används den för att uppdatera fält i cards man har laddat upp på sidan via dess id. Routen är skyddad med loginAuth för att hindra icke användare från att använda den. Först hämtas id från URL och alla cards laddas från lagringen via getCards. Därefter letar man efter kortet med det matchandet id, och om det inte hittas returneras 404 statuskod för "Not found". 

Sedan görs behörighetskontroll där användaren antingen måste vara ägaren av kortet via ownerId eller ha rollen admin, annnars returneras statuskod 403 (forbidden). Efter hämtas eventuella uppdaterade fält från req.body, brand, model, year,price och image. För att inte fylla json filen med bilder när man uppdaterar måste den gamla bilden i uploads ta bort. Det görs genom att kolla om klienten har skickat med en ny bild i requesten och om card redan har en bild card.image därefter kontrollerar man om den nya bilden är samma som innan eller att bilden har ändrats. Koden körs alltså endast om en ny bild finns, en gammal bild finns och de är olika bilder. Om den gamla bilden inte hittas loggas det i konsolen tack vare try/catch för att inte krascha servern.


Det viktiga med PATCH är att endast de fält som skickas i requesten uppdateras, vilket betyder till exempel om bara price skickas så ändras bara price medan resten av card blir oförändrat. När card uppdateras ersätts det gamla i listan med den uppdaterade versionen och hela listan sparas med saveCards. Till sist returneras det uppdaterade kortet som JSON. Om det blir fel under processen skickas statuskod 500.




```js
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

```

Skyddad asynkron POST route, allt är i en try/catch sats ifall internt server fel uppstår. Först hämtas data från requesten klienten skickar, därefter valideras om det obligatoriska datan finns, brand, model, year, och price. Annars skickas statuskod 400 för "Bad request". Konstanten cards hämtar cards arrayen via getCards och fortsätter när datan har hämtats pga await och async. newCard är det nya kortet som skapas av klienten, Date.now() för id och Number framför year och price för att se tiil att det inte är strings. Kortet får även användarens id för att senare kunna kontrollera vem som skapat den, samma med username. Till sist läggs det nya kortet till i listan och skrivs till filen via saveCards och det nya kortet skickas via json. Det problematiska med Date.now är att det kan krocka om flera användare skapar kort exakt samtidigt. Därför är try/catch bra men Date.now bör bytas till något annat senare.



## Upload och Filhantering
```js
import uploadRoutes from "./routes/upload.routes.js"
app.use("/api/upload", uploadRoutes)
```
Importerar en router från en separat js fil för struktur. Raden: app.use("/api/upload", uploadRoutes) kopplar routern till bas urlen /api/upload så alla routes som nås via det här prefixet /api/upload kommer hanteras av routern som exporteras från filen t.ex router.post("/") kommer bli tillgänglig via POST /api/upload . Innehållet visas nedanför:


### upload.routes.js
```js

import express from "express"
import multer from "multer"
import path from "path"

const router = express.Router()

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb)=>{
        const uniqueName = Date.now() + "-" + file.originalname
        cb(null, uniqueName)
    }
})

```
Här importeras express för skapa routern, multer för att hantera filuppladdningarna och path för att göra filvägar samt filändelser som krävs. const router = express.Router() är enda anledningen till att jag kan ha detta i separat fil, det används i stället för app i server.js. const storage = multer.diskStorage bestämmer hur och var filerna ska sparas på servern. Destinationen är då serverns uploadmapp.För att bestämma filens namn så kollar vi klientens request, information om filen t.ex namn och använder en callback funktion som körs när filen hanteras. För att filer inte ska skriva över varandra så läggs tiden i milisekunder Date.now till namnet tillsammans med filens original namn. 

```js
function fileFilter(req, file, cb) {
    const allowedTypes = [
        ".png",
        ".jpg",
        ".jpeg"
    ]
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedTypes.includes(ext)){
        cb(null, true)
    }else {
        cb(new Error("File type not allowed"), false);
        
    }
}

```
Funktion som hanterar vilka filer är tillåtna att laddas upp på sidan. Konstant som väljer vilka filändelser ska tillåtas, och const ext kollar filändelsen på filens original namn och gör sedan det till små bokstäver med toLowerCase funktionen. If satsen kollar därefter om den uppladdade filen innehåller en filändelse som inkluderas i den tillåtna listan. cb(null, true) körs och betyder att inget fel finns och den ska acceptera filen då filändelsen är tillåten. Annars om filändelsen inte finns i listan så skapas ett fel med meddelandet "File type not allowed", och den får inte gå vidare med uppladdningen eftersom filändelsen inte finns i listan. 
```js

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10* 1024* 1024 // 10MB
    }

})
```
Här definieras att multer ska köras, sparas i storage och använda filfiltrerings funktionen samt begränsing på filens storlek. 
```js
router.post("/", upload.single("image"), (req,res)=>{
    const file = req.file

    res.json({
        message: "Uploaded file",
        image: `/uploads/${req.file.filename}` 
    })  
})
export default router

```
POST route och eftersom jag använder app.use("/api/upload") så kommer den bli /api/upload. upload.single("image") är ett middleware från multer som tar emot en enda fil och
kräver att input fältet heter "image". Efter multer körs req.file som innehåller info om filen såsom filnman, sökväg och storlek vilket sparas i konstanten file. Till slut skickas svar till klienten via res.json med meddelande och filens filsökväg och router exporteras för att sedan importeras i server.js.




# Frontend - React 

## React, Vad är det och varför?
React är ett av flera javascript bibliotek för att bygga frontend. Istället för att hålla på med HTML direkt så bygger man komponenter vilket är återanvändbara funktioner som returnerar jsx (en blandning av javascript och HTML liknande syntax alltså språk regler.) React håller koll på när data ändras och uppdaterar där med bara de delar av sidan som behöver ändras istället för att ladda om allting på sidan för minsta lilla.


## main.jsx - Roten för React
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
main.jsx körs först och kopplar React till HTML-sidan som används i projektet. I index.html finns en div med id="root":. document.getElementById("root") hittar html diven med id root i webbläsaren. Medan createRoot() tar över diven och säger till React att allting ska renderas inuti den. .render() sätter igång rendering med App komponenten som rot och allt annat renderas inuti App.

Strictmode är bara ett utvecklingsverktyg som kör vissa saker dubbelt för att hitta buggar tidigt vilket bara används under utveckling. import './index.css' laddar bara den globala css filen som gäller för hela applikationen.

## Komponenter och Props
För att förstå hur react fungerar i mitt projekt kan det vara bra att veta vad Komponenter och props är. Komponenter är en funktioner som returnerar jsx. React anropar de funktionerna för att bygga upp sidan på klienten. T.ex min home sida är en funktion i en folder med en Home.jsx som jag exporterar: 
```jsx
export default function Home(){
   return(
    <main className="Home">
        This is home page homeboy
    </main>
   )
}

```
```jsx
import Home from './components/Home/Home.jsx'
```
Jag importerar komponenten i toppen av App.jsx för att sedan kunna använda den. Props däremot är argument som skickas till en komponent vilka är exakt som argument man skickar till en vanlig funktion. T.ex:
```jsx
function Header({page, setPage, setShowModal, setShowUploadModal})
```
Ett problem med detta kan uppstå när det blir alldeles för många funktioner att skicka props igenom t.ex om jag har Header med en nav och en button i nav som behöver t.ex page. Då måste jag skicka vidare propertyn page via header och sedan nav för att button ska kunna använda den. Context löser detta genom att dela data globalt utan det här då vilken komponent som helst oavsett ordningen det är uppbyggt i ska kunna läsa data direkt från kontexten.

## App.jsx Huvudkomponenten

### Imports 
```jsx
import './App.css'
import About from './components/About/About.jsx'
import Home from './components/Home/Home.jsx'
import { useState } from "react"
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'
import { CardProvider, useCards } from './context/UploadContext.jsx'
import UploadModal from './components/UploadModal/UploadModal.jsx'
import EditModal from './components/EditModal/EditModal.jsx'
```
Högst upp i App.jsx importeras alla komponenter och annat som App.jsx behöver. App.css är komponentens egna css vilket inte har någon css just nu. Komponenterna för de olika sidorna är About och Home som importeras för att renderas beroende på vilken sida användaren är på. useState importeras från React för att hantera state t.ex setPage="1" eller om page="0" visa Home. AuthProvider och useAuth importeras från min AuthContext för att kunna ge applikationen tillgång till autentisering samt låta alla komponenter kunna använda det. CardProvider och useCards importeras från uploadContext för att hantera korten. De tre modal komponenterna importeras för renderas när de behövs. 


### App komponenten och sidhantering
```jsx
function App() {
 const [page, setPage] = useState(()=>{
  const saved = sessionStorage.getItem("page");
  return saved ? Number(saved) : 0;
 })


 const [showUploadModal, setShowUploadModal] = useState(false);
 const [showModal, setShowModal] = useState(false);

 function handleSetPage(newPage){
  setPage(newPage);
  sessionStorage.setItem("page",newPage);
 }
 ```
Inuti app komponenten så börjar applikation med att använda React state för att hålla reda på vilken sida som användaren är på just nu genom page variabeln. När app först renderas hämtas page från sessionStorage ifall det finns ett sparat värde, vilket gör att användaren stannar kvar på samma sida även om man laddar om sidan och om inget värde har sparats så används 0 som default värde. Nedanför används för att syra om popup modalerna ska visas alltså Upload modalen och Auth modalen. showUploadModal och showModal håller koll om det ska visas och setShowUploadModal och setShowModal är funktion för att ändra på värdet för att antingen gömma eller vissa beroende på true/false.

Funktionen under skickar man in en ny sida som argument och ändrar den nuvarande sidan till den nya som därefter sparar det nya sidvärdet i sessionstorage.

 ```jsx
  return (
    <AuthProvider>
      <CardProvider>
      <>
        <Header page={page}
        setPage={handleSetPage}
        setShowModal={setShowModal}
        setShowUploadModal={setShowUploadModal}></Header>

        {page == 0 && <Home />}
        {page == 1 && <About />}
        {page == 3 && <Cards />}
      
        <Footer></Footer>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
        {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
        
      </>
      </CardProvider>
    </AuthProvider>
  )
}
export default App
```
Det här är vad som renderas av komponenten. AuthProvider och CardProvider sträcker sig runt hela innehållet, vilket innebär att de här komponenterna förser global state (context) för autentisering och korten till resten av applikationen. Inuti de två providers renderas först Header komponenten som får flera props såsom den aktuella sida (page), en funktion för att byta sida handleSetPage och funktionerna setShowModal, setShowUploadModal för att visa modal popupsen vid förfrågan. Allt detta gör att Headern kan styra sidnavigering och öppna modal popupsen vid behov.

Därefter renderas de olika sidorna beroende på värdet av page. Om page är 0 så renderas Home, 1 => About, 3 => Cards. Enkelt sätt att hantera sidorna utan t.ex React Router. Efter det renderas Footer komponenten vilket alltid visas längst ner. Efter footer hanteras modalerna. Om showModal är sann visas AuthModal, och om showUploadModal är sann så visas UploadModal. Båda använder en onClose funktion för att ändra deras React state till false för att gömma de när de stängs.

```jsx
function Header({page, setPage, setShowModal, setShowUploadModal}){
  const {user, logout} = useAuth();

  return(
    <header>
      

      <nav className='container'>
          <button className="btn" onClick={()=>setPage(0)}>Home</button>
          <button className="btn" onClick={()=>setPage(1)}>About</button>
          <button className="btn" onClick={()=>setPage(3)}>Cards</button>
          

         {user ? ( /*Om användare finns/aktiv så visas username idiv och logout knapp annars visas modal när man trycker på signin knappen*/
          <>
            <button className="btn" onClick={()=> setShowUploadModal(true)}>Upload</button>
            <button className="btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <button className="btn" onClick={() => setShowModal(true)}>
            Sign in/Up
          </button>
        )}
        </nav>
     
    </header>

)}
```
Här är Header komponenten. Med nav och 3 knappar som använder onClick funktionen för att enkelt ändra state på page när knapparna trycks på. Home knappen ändrar state till 0, About till 1 och Cards till 3. (Ingen har 2 för den komponenten togs bort.) Därefter om användare är sann/finns sp kommer Upload knappen och logout knappen att finnas i naven. Upload knappen använder också onClick funktionen för att ändra React state på ShowUploadModal till sann för att visa modalen. Vid klick på logout så används logout som hämtas från useAuth.

```jsx

function Footer(){
    return(
        <footer>
         <h2>Footer</h2>
        </footer>
    )
}
```
Footer komponent med en h2 tagg i som säger footer.

```jsx
function Cards(){
  const {cards, loading, error, delCard} = useCards();
  const { user } = useAuth();
  const [editingCard, setEditingCard] = useState(null);

  if (loading) return <p>Loading cards</p>
  if (error) return <p> {error} </p>
```
Här definieras Cards komponenten, med useCards() hämtas flera väden: cards, som innehåller alla cards, loading, som visar att datan håller på att laddas, error för eventuella felmeddelanden och delCard funktionen för att ta bort ett card. useAuth() används också för att hämta information om den inloggade användaren via user variabeln.
Komponenten använder state även lokalt för editingCard och setEditingCard som från början är null för att inget card redigeras men kan senare ändras. Innan komponenten renderar något så returnerar den en en p tagg som visar att korten håller på att laddas och om ett fel uppstår så returneras felmeddelandet istället. 
```jsx
return (
     <div className="cards-grid">
            {cards.map(card => (
                <div className="Card" key={card.id}>
                    <img src={card.image} alt={`${card.brand} ${card.model}`} />
                    <h3>{card.brand} {card.model}</h3>
                    <p>Year: {card.year}</p>
                    <p>Price: {card.price}</p>
                    <p>Added by {card.ownerName}</p>
                    {user && (user.id == card.ownerId || user.role === "admin") && (
                       <>
                      <button onClick={() => setEditingCard(card)}>Edit</button>
                      <button onClick={() => delCard(card.id)}>Delete</button>
                       
                       </>
                        
                    )}
                </div>
            ))}
```
Det som renderas när komponenten anropas är html liknande. Koden renderar en lista av alla cards genom att loopa igenom arrayen cards med hjälp av map. För varje card i listan så skapas ett nytt element som visar information om kortet först, bilden, märke, år, price och vem som lade upp det. Därefter om en användare är inloggad och deras id är samma som id av den som lade upp kortet eller har admin rollen så kommer knapparna för Edit och delete att visas. När användaren klickar på edit så anropas setEditingCard och det aktuella kortet sätts i ett redigeringsläge. När delete klickas anropas istället funktionen delCard med kortets id vilket tar bort kortet.
```jsx
        {editingCard && (
          <EditModal
          card={editingCard}
          onClose={()=> setEditingCard(null)}
          />
        )}
        </div>
  )
}
```
Till sist om editingCard är sann så renderas Edit modalen och när det stängs anropas onClose funktionen som sätter EditingCard till null med setEditingCard då inget kort längre redigeras.


## Home och About komponenter

```jsx
export default function Home(){
   return(
    <main className="Home">
        This is home page homeboy
    </main>
   )
}
```
Komponenten Home vilket är home sidan.
```jsx
export default function About(){
   return(
    <main className="About">
        This is about page homeboy
    </main>
   )
}

```
About komponenten som är about sidan.

## Modal popups: Auth, Upload och Edit

```jsx

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./AuthModal.css";


export default function AuthModal({onClose}){

    const [tab, setTab] = useState("login");

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const {login, register} = useAuth();
```
AuthModal hanterar både inloggning och registrering via ett tabsystem. "tab" state styr vilken av login och register ska visas och det börjar med login. Både login och register hämtas direkt från AuthContext via useAuth() och det betyder att modalen behöver inte veta hur det fungerar, den anropar bara funktionerna.
```jsx

    async function handleSubmit(){
        setError(null);
        setLoading(true);

        try{
            if (tab == "login"){

                await login(username, password);

            } else{
                await register(username, password);
                await login(username, password);
            }

            onClose();    

        }catch(err){
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }
```
handleSubmit funktion är asynkron och börjar med att rensa felmeddelande om det finns och sätter loading till true för att inaktivera knappen efter klick medan en request pågår. Därefter är det en try/catch och en if sats som kollar om tab är login aktiv. Om login tabben är aktiv så anropas login, annars anropas register och login för att logga in användaren automatiskt efter registrering. onClose stänger modalen om allt funkat som det ska. Om login eller register får ett fel så fångas det och visas för användaren, finally återställ loading till false.
```jsx

    function handleEnter(e){
        if (e.key == "Enter") handleSubmit();
    }

```
funktion som kollar om eventet som inträffar är att tangenten enter trycks ner och i såfall kör den handleSubmit funktionen istället för att behöva klicka på knappen.
```jsx
    return(
         <div className="modal-overlay" onClick={onClose}>

      {/*StopPropagation hindrar en från att klicka bort modal och klickar på den*/}
      <div className="modal" onClick={e => e.stopPropagation()}>

        
        <button className="modal-close" onClick={onClose}>✕</button>
```
Vid klick utanför modalen så stängs den ner medan stopPropagation hindrar att klick inuti modalen stänger ner den.

```jsx

        {/* Login Register tabbarna */}
        <div className="modal-tabs">
          <button
            className={tab == "login" ? "active" : ""}
            onClick={() => {
              setTab("login");
              setError(null); //Nollställer error vid tabbswitch
            }}
          >Login</button>
          <button
            className={tab == "register" ? "active" : ""}
            onClick={() => {
              setTab("register");
              setError(null); 
            }}
          >Register</button>
        </div>

        
        <h2>{tab == "login" ? "Welcome" : "Create account"}</h2>

```
className={tab == "login" ? active : ""} gör att om tab är login så får knappen klassen "active" annars får den "".  När den klickas på ändrar den state på tab till "login" och nollställer error. Samma gäller för Register knappen fast klassen active ges om tabben är register annars får den "". Vid klick på knappen ändrar den state på tab till register och nollställer också error. Längst ner är en h2 tagg som visar Welcome om tab == "login" är sann annars "Create account".
```jsx

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={handleEnter}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleEnter}
        />

        <button
          className="btn modal-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
        {tab == "login" ? "Login":"Register"}  
        </button>

      </div>
    </div>
  )
}      
```
Inputfälten är kontrollerade komponenter "value={username}" och "value={password}", gör att React styr det som visas i fältet. onChange körs vid varje knapptryckning och uppdaterar state med "e.target.value" vilket är det skrivna värdet. onKeyDown lyssnar efter knapptryckningar och anropar handleSubmit om Enter trycks ner.

### UploadModal.jsx och EditModal.jsx
De här två modalerna delar samma CSS fil och är uppbyggda på praktiskt taget samma sätt. Skillnaderna är följande:
```jsx
// UploadModal har tomma startvärden i state.
const [brand, setBrand] = useState("");
const [model, setModel] = useState("");

// EditModal förifyllda med befintlig kortdata
const [brand, setBrand] = useState(card.brand);
const [model, setModel] = useState(card.model);
```

UploadModal börjar med tomma fält eftersom ingen data finns då det är ett nytt kort.
EditModal får hela kortobjektet som prop och förifylls med data som redan finns. Användaren ser vad som finns och kan ändrar det de vill.
```jsx

//UploadModal hämtar addCard

const { addCard } = useCards();

// EditModal hämtar updateCard
const { updateCard } = useCards();
```
Båda hämtar sin funktion från UploadCOntext. UploadModal anropar "addCard" och EditModal anropar "updateCard" med kortets id som argument.

```jsx
// EditModal visar också nuvarande bild i det card som är valt om det finns en bild.
{card.image && (
 <div>
    <p className="Cimage">Current image:</p>
      <img
      src={card.image}
      alt="current"
      style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px" }}
    />
 </div>
)}
```
Om det inte finns en bild i card över huvudtaget så visas ingenting då det är en vilkorlig rendering "card.image &&". style={{}} är inline CSS i JSX de dubbla klamrarna är för att den yttre är jsx uttryck och den inre är javascript objekt.


```jsx
//Filinput i båda modalerna
<input
    type="file"
    accept="image/*"
    onChange={e => setImage(e.target.files[0])}
/>

```
Till skillnad från vanlig input där e.target.value används så används e.target.files istället som är en array med valda filer. "[0]" hämtar den första och enda filen. "accept="image/*" begränsar filväljaren till att bara visa bildfiler. I Editmodal betyder null i image state att den ska behålla den befintliga bilden. Bara om användaren väljer en ny fil laddas den upp.

```jsx
 <button
        className="btn modal-submit"
        onClick={handleSubmit}
        disabled={loading}
        >
        {loading ? "Saving..." : "Save changes"}
 </button>

```
disabled={loading} gör knappen inaktivt medan uppladdning pågår som sagt och utan detta hade användaren kunnat spamma för skapa duplicerade kort. Ternary operatorn ändrar knappens text för att ge användare info om något händer. "Saving..." ifall loading är true annars Save changes.

## Context

### AuthContext: Hantering av autentisering
Den här filen skapar och hanterar autentisering i hela React applikationen med hjälp av Context API. Mitt syfte med det är att göra användardata samt autentiseringsfunktionerna tillgängliga globalt utan att behöva skicka props genom flera komponenter.


```jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
```
Först importeras funktioner från React som behövs för att skapa och använda context samt hantera state. 
createContext för att skapa ett context, useContext för att använda det, useState för state, useEffect för att köra kod vid rendering. useEffect körs en gång när det laddas in om inte man lägger till ett vilkor som t.ex varje gång user ändras. Därefter skapas contextet som fungerar som en behållare för all autentiseringsdata.

### AuthProvider
```jsx
export function AuthProvider({children}){
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        async function checkSession(){
            try{
                const res = await fetch("/auth/me");
                if (res.ok){
                    const data = await res.json();
                    setUser(data);
                }
            }catch(err){
                console.log("No active session")
            }finally{
                setLoading(false);
            }
        }
        checkSession();
    }, [])

```
AuthProvider är en komponent som omsluter hela applikationen. Alla komponenter som ligger inuti den får tillgång till autentiseringsdatan. State variabeln user börjar som null då ingen är inloggad från början och loading true då det används för att visa att applikationen kontrollerar om en användare redan har en aktiv session. 

När applikationen laddas körs useEffect en gång då den inte har något i dependency arrayen att kontrollera.Inuti useEffect definieras en asynkron funktion som skickar en request till backend route "/auth/me" för att kontrollera om användaren redan är inloggad och om hämtningen av route är OK så hämtas användar datan och sparas i user via state annars om det går fel loggas det som "No active session" Till slut sätts loading till false oavsett resultat och då vet applikationen att kontrollen är klar och den kan rendera rätt innehåll. Efter att funktionen har definierats så körs den.


```jsx
async function login(username, password) {
    const res = await fetch("/auth/login",{
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setUser({id: data.id, username: data.username, role: data.role});
}
```
Funktionen login används för att logga in en användare genom att skicka en POST-request till backend-routen "/auth/login". ANvändarnamn och lösenord skickas med i requestens body som JSON. När svaret kommer tillbaka konverteras det till Javascript objekt. Om svaret inte är OK kastas ett fel med meddelandet från servern. Om inloggningen lyckas sparas användarens information (id,username,roll) i user state variabeln, som gör att resten av applikationen vet att en användare är inloggad.

```jsx

async function register(username, password){
    const res = await fetch("/auth/register",{
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username,password})
    });
    const data = await res.json();
    if(!res.ok)throw new Error(data.message);
}
```
Funktionen register används för att skapa en ny användare. Den skickar på samma sätt en POST-request, men till "/auth/register", med användarnamn och lösenord i body. Svaret konverteras till JSON och om något går fel kastas ett felmeddelande. Funktionen i sig loggar inte in användaren, det görs separat efter registrering(Genom att köra login funktionen direkt efter).

```jsx
async function logout(){
    await fetch("/auth/logout",{method:"POST"});
    setUser(null);
}
```
Den här asynkrona logout funktionen används för att logga ut användaren. Den skickar en POST-request till "/auth/logout" och när den är klar sätts state variabeln user till null. Det gör att applikationen uppdateras och behandlar användaren som utloggad.
```jsx

return (
    <AuthContext.Provider value={{user, loading, login, register, logout}}>
        {children}
    </AuthContext.Provider>
);
}
```
Det som returneras av AuthProvider är AuthContext.Provider och är det som faktiskt delar ut datan till resten av applikationen. "value" är ett objekt med allt som ska vara tillgängligt: user, loading, login, register och logout. 
Alla komponenter som omsluts av den här Provider kan läsa värdena. "children" är ett speciellt prop i React som representerar allt som renderas inuti komponenten.


```jsx
export function useAuth(){
    return useContext(AuthContext);
}

```
"useContext(AuthContext)" läser det som lagts i Providers value och returnerar det. "useAuth" är en custom hook => en funktion som börjar med "use" och som anropar andra React-hooks inuti sig. Utan custom hook hade varje komponent behövt importera både "useContext" och "AuthContext" separat. Till exempel:
```jsx
// Utan en custom hook:
import { useContext } from "react"
import { AuthContext } from "../../context/AuthContext"
const { user } = useContext(AuthContext)

// Med en custom hook:
import { useAuth } from "../../context/AuthContext"
const { user } = useAuth()
```


## UploadContext.jsx Korthanteringskontext

UploadContext är ungefär samma som AuthContext men ansvarar för all korthantering som hämtning, skapande, uppdatering och borttagning. Genom att samla all kortlogik här i context behöver ingen enskild komponent göra egna fetch anrop.
```jsx
import { createContext, useContext, useState, useEffect } from "react";
import {useAuth} from "./AuthContext";



const UploadContext = createContext();

export function CardProvider({children}){
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {user} = useAuth();

    useEffect(()=>{
        loadCards();
    }, [user]);

```
Till skillnad från AuthContext importerar CardProvider "user" från AuthContext via "useAuth()". Det funkar eftersom CardProvider är omsluten av AutoProvider i App.jsx vilket ger den tillgång till AuthContext. 

"cards" är arrayen med alla kort och börjar som tom, "loading" börjar som true för att visa laddningstext medan korten hämtas. "error" håller eventuella felmeddelanden som visas för användaren.

"useEffect" har "[user]" som dependency array istället för en tom "[]" detta betyder att "loadCards" körs varje gång som "user" ändras och inte bara vid start. Detta löser problemet med att när en användare loggar in så ändras user från null till ett användarobjekt vilket triggar en omladdning av korten för att på så sätt rendera de med korrekt användardata och ägarkontroll så edit och delete knapparna visas samt fungerar direkt utan att behöva ladda om sidan manuellt.

### loadCards 
```jsx
async function loadCards(){
    try{
        const res = await fetch("/cards");
        const data = await res.json();
        setCards(data);
    }catch(err){
        setError("Cards could not load.")
    }finally{
        setLoading(false)
    }
}
```
Asynkron funktion som hämtar alla kort från serverns Get /cards route och spara dem i state med "setCards". "catch" fångar fel och sparar felmeddelandet i error state som Cards komponenten sedan visar för användaren. finally sätter alltid loading till false oavsett resultat som sagt så att laddningstexten alltid försvinner.

### addCard
```jsx
async function addCard(brand, model, year, price, image){
    let imagePath = "";
    if (image) {
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await fetch("/api/upload",{
            method:"POST",
            body: formData
            
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();
        imagePath = uploadData.image;

    }

```
Att skapa ett kort tar två steg eftersom bilden måste laddas upp separat för att ge tillbaka en filsökväg innan kortet kan skapas med rätt bildreferens.

Första steget: Ladda upp bilden
Om en bild valdes så skapas ett formData objekt. FormData är ett speciellt webbläsarobjekt för att skicka filer. Vanlig JSON kan inte innehålla filer. "formData.append("image", image) lägger till filen under nyckeln "image" som måste matcha vad multer på servern förväntar sig. Webbläsaren sätter automatiskt rätt Content-Type header med boundary för multiparty-data. Så man sätter inte den manuellt. Servern svarar därefter med sökvägen där bilden sparades t.ex "/uploads/17892382983-test.png" som sparas i "imagePath".

```jsx

    const res = await fetch("/cards",{
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({brand, model, year, price, image:imagePath})
    });
    if (!res.ok){
        const data = await res.json();
        throw new Error(data.message);
    }
    const newCard = await res.json();
    setCards(prev => [...prev, newCard]);
    return newCard;
}
```
Det andra steget är att skapa kortet.
En vanlig JSON-request skickas med kortdata och bildsökvägen från steg 1. Om ingen bild har valts så är "imagePath" en tom sträng. Servern svarar med det skapade kortet som direkt läggs till i den lokala listan.

### updateCard

```jsx
async function updateCard(id, brand, model, year, price, image){
    let imagePath = null; // Om ingen bild laddas up ändra inte//
    

    if (image && typeof image !== "string"){
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await fetch("/api/upload",{
            method:"POST",
            body: formData
        });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const uploadData = await uploadRes.json();
        imagePath = uploadData.image;
    }

    const res = await fetch("/cards/"+ id,{
        method:"PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            brand,
            model,
            year,
            price,
            image: imagePath || undefined
    })
});
```
updateCard liknar addCard men har 3 skillnader. "imagePath" börjar som "null" istället för en tom sträng. Null betyder "skicka ingen bild alls och behåll den gamla på servern" En tom sträng hade skrivit över den gamla bilden med ingenting.

"typeof image !== "string" skiljer mellan ett file objekt som är en ny uppladdad bild från filinput och en sträng som är en redan existerande bildsökväg. Bara om det är ett file objekt så laddas en ny bild upp. Det behövs eftersom EditModal håller image state som null när ingen ny bild har valts och som ett File objekt när användaren valt en ny fil.

"image: imagePath || undefined" betyder att om imagePath är null så skickas undefined vilket gör att fältet inte inkluderas i JSON-bodyn över huvudtaget. PATCH-routen på servern uppdaterar bara de input som faktiskt skickas. Om image utelämnas behålls den gamla bilden oförändrad som sagt.

```jsx

    const updatedCard = await res.json();
    setCards(prev=>prev.map(c=>c.id == id ? updatedCard : c));
    return updatedCard;

}
```
"map()" går igenom varje kort i arrayen. Om kortets id matchar ersätts det med "updatedCard", annars returneras kortet oförändrat. Resultatet blir en ny array med det uppdaterade kortet på rätt plats och allt annat oförändrat, sidan uppdateras direkt utan att hämta om alla kort från servern.

### delCard

```jsx
async function delCard(id){
    const res = await fetch("/cards/"+id, {method:"DELETE"});
    if (!res.ok){
        const data = await res.json();
        throw new Error(data.message)
    }
    setCards(prev => prev.filter(card => card.id !== id));
}
```
delCard är en asynkron funktion som skickar en DELETE-request till servern med kortets id i URL:en. Om servern nekar t.ex om användaren inte äger kortet eller inte är inloggad så kastas ett fel med "throw new Error(data.message)" som fångas av Cards komponenten och visas som text på sidan.

Om det lyckas filtreras kortet bort lokalt med ".filter()" alla kort vars id inte matchar det raderade kortets id behålls i den nya arrayen. Det raderade kortet försvinner direkt från sidan utan att behöva hämta om alla kort från servern igen.
```jsx
return(
    <UploadContext.Provider value={{cards,loading,error,addCard,delCard, updateCard}}>
        {children}
    </UploadContext.Provider>
);
}

export function useCards(){
    return useContext(UploadContext);
}
```
Det CardProvider returnerar är UploadContext.Provider och är precis som AuthProvider då det är den delen som delar ut datan till resten av applikationen. Som sagt är "value" ett objekt med allt som ska vara tillgänligt för de andra komponenterna som omslutas av CardProvider. I detta fallet ska cards, loading, error, addCard, delCard och updateCard vara tillgängligt. Precis som innan så kan alla komponenter som omsluts av den här Providern läsa värdena och "children" är speciellt prop i React som betyder allt som renderas inuti komponenten.

Här används också en custom hook då useContext(UploadContext) läser Providers value och returnerar det. "useCards" är då en custom hook alltså funktion som anropar de andra hooks inuti sig. Precis som useAuth.






