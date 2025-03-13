//example using socket.io
const express = require("express");
const http= require("http");
const {Server} = require("socket.io");
require("dotenv").config();
const OpenAI = require("openai"); 

const openai = new OpenAI({
     
  });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

//setup static folder
app.use(express.static("public"));
const users = new Set();

//get responses from chatbot
async function getBotResponse(message) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `respond to user message, ${message}` }],
      });
  
      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error fetching bot response:", error);
      return "I'm having trouble responding right now.";
    }
  }

//actual socket.io application
io.on("connection",(socket)=>{
    console.log("A new user connected to the server")

    //set user
    socket.on("set username", (username)=>{
        socket.username = username;
        users.add(username)
        socket.emit("user list", Array.from(users));
    })

    socket.on("chat message", async(msg)=>{
        console.log(`message from ${socket.id}: ${msg}`);
        // broadcast message to all connect clients
        io.emit("chat message",`${socket.username}: ${msg}`);

        if(msg.toLowerCase().startsWith("@bot")){
            console.log("Bot detected!");
            const botResponse = await getBotResponse(msg.replace("@bot", "").trim());
            console.log("Bot response:", botResponse);
            io.emit("chat message", `Bot: ${botResponse}`);
        }

    })

    

    socket.on("disconnect", ()=>{
        console.log("User disconnected:", socket.io);
        users.delete(socket.username);
        io.emit("user list", Array.from(users));
    })
})

server.listen(3000, ()=>{
    console.log("Server running on port 3000")
})