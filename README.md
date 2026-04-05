# 3D-React
GA

GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDENGÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN
GÖR SÅ ATT EDIT TAR BORT DEN GAMLA BILDEN

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
Asynkron POST route för login, använder try and catch, 