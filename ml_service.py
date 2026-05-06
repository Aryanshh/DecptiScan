from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = FastAPI(title="DeceptiScan BERT Service")

# Load a pre-trained fraud detection or sentiment model
# For a real implementation, you would use a model fine-tuned on job scams.
# Here we use a generic placeholder that can be replaced with 'path/to/your/fine-tuned-bert'
MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"

print(f"Loading model: {MODEL_NAME}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

class PredictRequest(BaseModel):
    text: str

@app.post("/predict")
async def predict(request: PredictRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    try:
        # Preprocess text
        inputs = tokenizer(request.text, return_tensors="pt", truncation=True, padding=True, max_length=512)
        
        # Inference
        with torch.no_grad():
            outputs = model(**inputs)
            probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
        # For this example model: 
        # index 0 is 'Negative' (could map to Fake), 1 is 'Positive' (Genuine)
        # In a real fraud model, you'd have specific labels.
        prob_scam = probabilities[0][0].item()
        
        verdict = "Genuine"
        if prob_scam > 0.8:
            verdict = "Fake"
        elif prob_scam > 0.5:
            verdict = "Suspicious"
            
        return {
            "probability": round(prob_scam, 4),
            "verdict": verdict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
