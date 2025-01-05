const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const chrono = require("chrono-node");
const { createObjectCsvWriter } = require("csv-writer");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const csvWriter = createObjectCsvWriter({
  path: "./appointments.csv",
  header: [
    { id: "name", title: "Name" },
    { id: "phone", title: "Phone" },
    { id: "address", title: "Address" },
    { id: "email", title: "Email" },
    { id: "date", title: "Date" },
  ],
});

const GEMINI_API_KEY = "AIzaSyCPMHFT5RArsOUQ9mlUqzuewZd6addNFSQ";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

let userSessionData = {};

async function queryGemini(query) {
  try {
    const response = await axios.post(
      `${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: query }] }],
      },
      { headers: { "Content-Type": "application/json" } }
    );
    const responseText = response.data.candidates[0].content.parts[0].text;
    return responseText;
  } catch (err) {
    console.error(err);
    throw new Error("Error querying Gemini LLM");
  }
}

app.post("/query", async (req, res) => {
  const { query } = req.body;


  const callIntentKeywords = ["call them", "schedule a call", "book a call","book an appointment","appointment please","make an appointment"];

  if (!userSessionData.step && callIntentKeywords.some(keyword => query.toLowerCase().includes(keyword))) {
    userSessionData = { step: 1, name: "", phone: "", address: "", email: "", date: "" };
    return res.json({ response: "O great !!Please,Tell me What is your name?" });
  }

  if (userSessionData.step) {
    let response = "";

    try {
      switch (userSessionData.step) {
        case 1:
          userSessionData.name = query;
          response = "Thank you! Please provide your phone number.";
          userSessionData.step++;
          break;
        case 2:
          if (/^\d{10}$/.test(query)) {
            userSessionData.phone = query;
            response = "Got it! What's your address?";
            userSessionData.step++;
          } else {
            response = "That doesn't look like a valid phone number. Please provide a 10-digit phone number.";
          }
          break;
        case 3:
          userSessionData.address = query;
          response = "Thanks! Could you also provide your email address?";
          userSessionData.step++;
          break;
        case 4:
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
            userSessionData.email = query;
            response = "Great! Finally, when would you like to schedule the appointment?";
            userSessionData.step++;
          } else {
            response = "That doesn't seem to be a valid email address. Please provide a valid email.";
          }
          break;
        case 5:
          const parsedDate = chrono.parseDate(query);
          if (parsedDate) {
            userSessionData.date = parsedDate.toISOString().split('T')[0];
            response = `Thank you! Your appointment has been scheduled for ${userSessionData.date}.`;
            await csvWriter.writeRecords([userSessionData]);
            userSessionData = {};
          } else {
            response = "I couldn't parse that date. Please provide a valid date for the appointment.";
          }
          break;
      }
      return res.json({ response });
    } catch (err) {
      console.error(err);
      return res.status(500).send("Error processing your request");
    }
  }

  
  try {
    const generalResponse = await queryGemini(query);
    return res.json({ response: generalResponse });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error querying LLM");
  }
});

app.listen(5000, () => console.log("Server is running on http://localhost:5000"));
