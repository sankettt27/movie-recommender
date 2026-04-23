# CineMatch AI - Movie Recommendation System

This is a complete, visually stunning web application for movie recommendations using Machine Learning (scikit-learn). 
It features a premium black and red futuristic theme, 3D interactions, and glassmorphism.

## 🚀 Tech Stack
- **Backend:** Python, FastAPI, scikit-learn, pandas
- **Frontend:** HTML, Vanilla CSS, Vanilla JavaScript, Particles.js
- **Machine Learning:** TF-IDF Vectorizer and Cosine Similarity

## 📂 Project Structure
```text
/
├── main.py               # FastAPI server and ML logic
├── requirements.txt      # Python dependencies
├── static/
│   ├── index.html        # Main HTML file
│   ├── style.css         # Styling, 3D animations, glassmorphism
│   └── script.js         # Frontend logic, API calls, and 3D parallax
└── README.md             # Project documentation
```

## ⚙️ How to Run Locally

1. **Install dependencies:**
   Make sure you have Python installed, then install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the server:**
   Run the backend application using uvicorn:
   ```bash
   python main.py
   ```
   *Note: This will download the dataset from the remote source into memory and calculate the similarity matrix on startup. It may take a few seconds.*

3. **Access the Web App:**
   Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## 🎯 Features
- Uses the official `movie_dataset.csv` directly via URL.
- Cleans missing values efficiently.
- Combines `genres` and `overview` for accurate similarity tracking.
- Interactive Search with Auto-Complete.
- Stunning 3D card layout with hover parallax.
- Fluid UI animations.
