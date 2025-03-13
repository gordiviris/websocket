//example using socket.io
const express = require("express");
const http= require("http");
const {Server} = require("socket.io");
require("dotenv").config();
const OpenAI = require("openai"); 

const openai = new OpenAI({
    apiKey: "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"
    //apiKey: "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",
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