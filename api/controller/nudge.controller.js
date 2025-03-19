// api/controller/nudge.controller.js
import dotenv from "dotenv";
import fetch from "node-fetch"; 
import { createError } from "../utils/error.js";

// 1) Load environment
dotenv.config();

export const getDailyNudge = async (req, res, next) => {
  try {
    // 2) Check your OpenAI key
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return next(createError(500, "No OpenAI API key found in .env"));
    }

    // 3) Build your prompt
    const prompt = `
      You are an AI that provides short eco-friendly clothing tips or challenges.
      Give me a single short tip or challenge (1-2 sentences).
    `;

    // 4) Prepare request data
    const bodyData = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    };

    // 5) POST to Chat Completions
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(bodyData),
    });

    // 6) Handle fetch errors
    if (!response.ok) {
      const errorText = await response.text();
      return next(createError(500, `OpenAI error: ${errorText}`));
    }

    // 7) Parse JSON
    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      return next(createError(500, "OpenAI did not return a valid response"));
    }

    // 8) Extract the tip
    const tip = data.choices[0].message.content.trim();

    // 9) Send back as JSON
    return res.status(200).json({
      success: true,
      nudge: tip,
    });
  } catch (error) {
    next(error);
  }
};