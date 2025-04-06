# ReStyle - Behaviour-Change Interface

## Brief Description

**ReStyle** is a web-based platform designed to promote sustainable fashion behaviours through behavioural nudging, gamification, and eco-feedback. The project specifically targets Gen Z users, aiming to bridge the "green gap" by making mindful fashion habits engaging, clear, and rewarding. Users can digitally manage their wardrobes, track clothing re-use, and receive personalised sustainability statistics to encourage environmentally friendly fashion choices.

**Live Version:** [restyle-app.onrender.com](https://restyle-app.onrender.com)

## Features

- **Wardrobe Management:** Add and manage your clothing items digitally.
- **Outfit Tracking:** Log daily outfits with a calendar interface.
- **Re-wear Tracking:** Keep track of clothing item usage.
- **Sustainability Feedback:** Receive personalised eco-feedback showing CO2 and water savings.
- **Gamification:** Stay motivated with streak counters and sustainability challenges.
- **Dynamic Nudges:** Daily sustainability tips generated dynamically.

## Technologies Used

- **Frontend:** React 18, React Router v6, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Storage & Image Processing:** Firebase, dom-to-image
- **Dynamic Content:** OpenAI GPT API

## Running the Project

Follow these steps to run ReStyle locally:

### Step 1: Install Dependencies and Run the Backend

From the root folder, open a terminal and run:

```bash
cd api
npm install
npm start
```

The backend server will be running on:

```
http://localhost:3000
```

### Step 2: Install Dependencies and Run the Frontend

In another terminal, navigate from the root folder and run:

```bash
cd client
npm install
npm run dev
```

The frontend will be accessible at:

```
http://localhost:5173
```

---

If you would like to view the live version, please visit:  
[restyle-app.onrender.com](https://restyle-app.onrender.com)

