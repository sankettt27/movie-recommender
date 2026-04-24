import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import io

app = FastAPI(title="Movie Recommendation API")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
df = None
cosine_sim = None

def init_model(dataset_source):
    global df, cosine_sim
    print("Loading dataset...")
    df_temp = pd.read_csv(dataset_source)
    
    # Standardize column names (lowercase and strip spaces)
    df_temp.columns = df_temp.columns.str.lower().str.strip()
    
    # Guess column mapping
    col_mapping = {}
    
    # Find title column
    title_candidates = ['title', 'movie_title', 'name', 'original_title']
    for cand in title_candidates:
        if cand in df_temp.columns:
            col_mapping[cand] = 'title'
            break
            
    # Find genres column
    genre_candidates = ['genres', 'genre', 'categories', 'category', 'listed_in']
    for cand in genre_candidates:
        if cand in df_temp.columns:
            col_mapping[cand] = 'genres'
            break
            
    # Find overview/description column
    overview_candidates = ['overview', 'description', 'plot', 'summary', 'story', 'synopsis']
    for cand in overview_candidates:
        if cand in df_temp.columns:
            col_mapping[cand] = 'overview'
            break
            
    # Rename columns to standard names
    df_temp.rename(columns=col_mapping, inplace=True)
            
    if 'title' not in df_temp.columns:
        raise ValueError(f"Dataset must contain a title column. Found columns: {list(df_temp.columns)}")

    # Fill missing values for potential features
    # We prioritize 'genres' and 'overview', but will add 'keywords', 'cast', and 'director' if available for better accuracy!
    potential_features = ['genres', 'overview', 'keywords', 'cast', 'director']
    features_to_use = []
    
    for feature in potential_features:
        if feature in df_temp.columns:
            df_temp[feature] = df_temp[feature].fillna('')
            features_to_use.append(feature)

    # Combine available features into a single string
    def combine_features(row):
        combined = ""
        for feature in features_to_use:
            combined += str(row[feature]) + " "
        return combined.strip()

    df_temp['combined_features'] = df_temp.apply(combine_features, axis=1)

    # Compute Similarity matrix
    print("Computing cosine similarity matrix...")
    cv = TfidfVectorizer(stop_words='english')
    count_matrix = cv.fit_transform(df_temp['combined_features'])
    
    # Update globals
    cosine_sim = cosine_similarity(count_matrix)
    df = df_temp
    print("Model ready!")

# Initialization logic
LOCAL_DATASET = "movie_dataset.csv"
SAMPLE_DATASET = "sample_movies.csv"
DATA_URL = "https://raw.githubusercontent.com/codeheroku/Introduction-to-Machine-Learning-with-Python/master/data/movie_dataset.csv"

def startup():
    global df, cosine_sim
    try:
        if os.path.exists(LOCAL_DATASET):
            print(f"Loading local dataset: {LOCAL_DATASET}")
            init_model(LOCAL_DATASET)
        elif os.path.exists(SAMPLE_DATASET):
            print(f"Loading sample dataset: {SAMPLE_DATASET}")
            init_model(SAMPLE_DATASET)
        else:
            print(f"Attempting to download dataset from {DATA_URL}")
            init_model(DATA_URL)
    except Exception as e:
        print(f"Initialization failed: {e}. Waiting for local upload via frontend.")

startup()


# Helper functions
def get_index_from_title(title):
    if df is None: return None
    res = df[df.title.astype(str).str.lower() == title.lower()]
    if not res.empty:
        return res.index[0]
    return None

def get_movie_details(index):
    if df is None: return {}
    row = df.iloc[index]
    return {
        "title": row["title"],
        "genres": row.get("genres", "Unknown Genres") if pd.notna(row.get("genres")) and row.get("genres") != "" else "Unknown Genres",
        "overview": row.get("overview", "No description available.") if pd.notna(row.get("overview")) and row.get("overview") != "" else "No description available."
    }

# API Endpoints
@app.get("/status")
def get_status():
    return {"loaded": df is not None}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        init_model(io.BytesIO(contents))
        return {"status": "success", "message": "Dataset loaded successfully!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/movies")
def get_movies():
    """Returns a list of all movie titles for frontend autocomplete"""
    if df is None:
        return {"movies": []}
    movies = df['title'].dropna().astype(str).tolist()
    return {"movies": sorted(movies)}

@app.get("/recommend")
def recommend_movies(movie: str):
    """Returns top 5 movie recommendations for a given movie title"""
    if df is None:
        return {"error": "Dataset not loaded. Please upload the movie dataset first."}
        
    movie_idx = get_index_from_title(movie)
    if movie_idx is None:
        return {"error": "Movie not found. Please try another one."}
    
    # Get pairwise similarity scores
    similar_movies = list(enumerate(cosine_sim[movie_idx]))
    
    # Sort the movies based on similarity scores
    sorted_similar_movies = sorted(similar_movies, key=lambda x: x[1], reverse=True)[1:6] # Skip the first one (itself)
    
    recommendations = []
    for element in sorted_similar_movies:
        recommendations.append(get_movie_details(element[0]))
        
    return {"recommendations": recommendations}

# Mount static files to serve the frontend
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    # Get port from environment variable for deployment (Render/Heroku)
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port)

