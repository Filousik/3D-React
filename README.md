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
Jag använder fs promises för att kunna köra funktioner asynkront för servern inte ska haka upp sig på en sak. Jag vill att flera funktioner kan köras i bakgrunden utan problem. Därför använder jag async och fs promises och await för att servern ska vänta i detta fallet tills filen är uppläst och promise för att lova att ge resultat senare. Jag använder try and catch för att om det blir fel och filen inte finns så returnas tom array för att inte krascha servern.


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

App.jsx
main.jsx
About.jsx
Home.jsx
Card.jsx
UploadModal.jsx
AuthModal.jsx
EditModal.jsx
AuthContext.jsx
UploadContext.jsx



