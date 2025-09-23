import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();  // environment variables load karne ke liye

async function testOpenAIKey() {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });
  const data = await res.json();
  console.log(data);
}

testOpenAIKey();
