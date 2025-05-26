import torch
from torchvision import transforms
from PIL import Image
import os
from django.conf import settings

model = None

class_names = ["Normal", "Pneumonia"]

# Define a threshold for Pneumonia confidence
# This value will need to be tuned based on your desired balance
# between false positives (misclassifying Normal as Pneumonia)
# and false negatives (misclassifying Pneumonia as Normal).
# A good starting point might be higher than the 68.11% you observed for a normal image.
PNEUMONIA_CONFIDENCE_THRESHOLD = 0.75 # Example: Only consider Pneumonia if confidence is 75% or higher

def load_model():
    global model
    from torchvision.models import resnet18

    model = resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, len(class_names))

    model_path = os.path.join(settings.BASE_DIR, "pulmoscan", "model_weights", "pneumonia_resnet18.pt")

    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found at: {model_path}")
        return

    try:
        model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        print(f"Model loaded successfully from: {model_path}")
    except Exception as e:
        print(f"ERROR loading model state_dict: {e}")
        return

    model.eval()
    print("Model set to evaluation mode.")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def run_ai_on_scan(image_path):
    if not os.path.exists(image_path):
        print(f"ERROR: Image file not found at: {image_path}")
        return {"diagnosis": "Error", "confidence": 0, "message": "Image file not found"}

    if model is None:
        print("Model not loaded, attempting to load...")
        load_model()
        if model is None:
            return {"diagnosis": "Error", "confidence": 0, "message": "Model failed to load"}

    try:
        image = Image.open(image_path).convert("RGB")
        img_tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = model(img_tensor)
            
            # --- DEBUG PRINTS (KEEP THESE FOR NOW) ---
            print(f"--- AI Inference Debug for {image_path} ---")
            print(f"Raw model outputs (logits): {outputs}")
            
            probabilities = torch.softmax(outputs, dim=1)[0]
            print(f"Softmax probabilities: {probabilities}")

            # Get the confidence for Pneumonia (Index 1)
            pneumonia_confidence = probabilities[class_names.index("Pneumonia")].item()
            normal_confidence = probabilities[class_names.index("Normal")].item()

            # --- APPLY THRESHOLD LOGIC ---
            final_diagnosis = "Normal"
            final_confidence = round(normal_confidence * 100, 2)

            if pneumonia_confidence >= PNEUMONIA_CONFIDENCE_THRESHOLD:
                final_diagnosis = "Pneumonia"
                final_confidence = round(pneumonia_confidence * 100, 2)
            else:
                # If pneumonia confidence is below threshold, but still the highest,
                # we default to "Normal" and report the normal confidence.
                # However, for clarity, you might want to report the pneumonia confidence
                # even if it's below threshold and you label it normal.
                # For this example, if it's below threshold, we're explicitly saying Normal.
                pass # The defaults for final_diagnosis and final_confidence are already "Normal" and its confidence

            # --- END THRESHOLD LOGIC ---

            # Optional: You can still print what the raw model predicted before thresholding
            _, raw_predicted_idx_tensor = torch.max(probabilities, 0)
            raw_predicted_idx = raw_predicted_idx_tensor.item()
            print(f"Raw model predicted index: {raw_predicted_idx} ({class_names[raw_predicted_idx]})")
            print(f"Raw model predicted confidence: {probabilities[raw_predicted_idx].item()*100:.2f}%")
            # --- END DEBUG PRINTS ---

        print(f"Final Diagnosis (After Threshold): {final_diagnosis}, Final Confidence: {final_confidence}%")

        return {
            "diagnosis": final_diagnosis,
            "confidence": final_confidence
        }
    except Exception as e:
        print(f"ERROR during AI inference: {e}")
        return {"diagnosis": "Error", "confidence": 0, "message": f"Inference failed: {e}"}
    




































# backend/medpharma/utils.py

'''import torch
from torchvision import transforms
from PIL import Image
import os
from django.conf import settings # Make sure this import is present

model = None

def load_model():
    """
    Loads the pre-trained ResNet18 model for pneumonia detection.
    The model path is constructed using settings.BASE_DIR to ensure
    it's found correctly in different environments (local dev vs. deployment).
    """
    global model
    from torchvision.models import resnet18

    # Initialize the ResNet18 model architecture
    model = resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, 2)  # Output layer for 2 classes: Normal, Pneumonia

    # Construct the absolute path to the model weights file
    # settings.BASE_DIR points to your 'backend/' directory (where manage.py is)
    # Then navigate into the 'medpharma' app, then 'model_weights' folder
    model_path = os.path.join(settings.BASE_DIR, "pulmoscan", "model_weights", "pneumonia_resnet18.pt") 

    # Load the state dictionary (weights) onto the model, mapping to CPU for deployment
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    
    # Set the model to evaluation mode (important for consistent predictions)
    model.eval()

# Define the image transformations required by the model
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),  # Ensure 3 channels even if input is grayscale
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]) # Standard ImageNet normalization
])

def run_ai_on_scan(image_path):
    """
    Runs the AI model on a given image path to predict pneumonia.

    Args:
        image_path (str): The file path to the X-ray image.

    Returns:
        dict: A dictionary containing the diagnosis ('Pneumonia' or 'Normal')
              and the confidence level (percentage).
    """
    # Load the model if it hasn't been loaded yet (lazy loading)
    if model is None:
        load_model()

    # Open and transform the image
    image = Image.open(image_path).convert("RGB") # Ensure image is in RGB format
    img_tensor = transform(image).unsqueeze(0)    # Add batch dimension (1, C, H, W)

    # Perform inference without tracking gradients
    with torch.no_grad():
        outputs = model(img_tensor)
        # Get the predicted class (0 or 1)
        _, predicted = torch.max(outputs, 1)
        # Calculate the confidence (softmax probability of the predicted class)
        prob = torch.softmax(outputs, dim=1)[0][predicted].item()

    # Map the predicted class to a human-readable label
    label = "Pneumonia" if predicted.item() == 1 else "Normal"
    
    return {
        "diagnosis": label,
        "confidence": round(prob * 100, 2) # Return confidence as percentage
    }

# backend/medpharma/utils.py
import torch
from torchvision import transforms
from PIL import Image
import os
from django.conf import settings

model = None

# Keep this: Based on your tests, this is the correct mapping for your model.
class_names = ["Normal", "Pneumonia"]

def load_model():
    global model
    from torchvision.models import resnet18

    model = resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, len(class_names))

    model_path = os.path.join(settings.BASE_DIR, "pulmoscan", "model_weights", "pneumonia_resnet18.pt")

    # Important: Error handling for file not found
    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found at: {model_path}")
        # Consider raising an exception or returning None
        return

    try:
        model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        print(f"Model loaded successfully from: {model_path}")
    except Exception as e:
        print(f"ERROR loading model state_dict: {e}")
        # Consider logging the full traceback or raising an exception
        return

    model.eval()
    print("Model set to evaluation mode.")

# ... (rest of transform)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
def run_ai_on_scan(image_path):
    # Added for debugging file path
    if not os.path.exists(image_path):
        print(f"ERROR: Image file not found at: {image_path}")
        return {"diagnosis": "Error", "confidence": 0, "message": "Image file not found"}

    if model is None:
        print("Model not loaded, attempting to load...")
        load_model()
        if model is None: # If loading failed
            return {"diagnosis": "Error", "confidence": 0, "message": "Model failed to load"}

    try:
        image = Image.open(image_path).convert("RGB")
        img_tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = model(img_tensor)
            # --- START DEBUG PRINTS ---
            print(f"--- AI Inference Debug for {image_path} ---")
            print(f"Raw model outputs (logits): {outputs}") # e.g., tensor([[0.1, 0.9]])
            
            probabilities = torch.softmax(outputs, dim=1)[0]
            print(f"Softmax probabilities: {probabilities}") # e.g., tensor([0.475, 0.525])

            _, predicted_idx_tensor = torch.max(probabilities, 0) # Use probabilities, not raw outputs
            predicted_idx = predicted_idx_tensor.item()
            print(f"Predicted index: {predicted_idx}") # 0 or 1

            confidence = probabilities[predicted_idx].item()
            # --- END DEBUG PRINTS ---

        diagnosis_label = class_names[predicted_idx]
        
        print(f"Final Diagnosis: {diagnosis_label}, Final Confidence: {round(confidence * 100, 2)}%")

        return {
            "diagnosis": diagnosis_label,
            "confidence": round(confidence * 100, 2)
        }
    except Exception as e:
        print(f"ERROR during AI inference: {e}")
        return {"diagnosis": "Error", "confidence": 0, "message": f"Inference failed: {e}"}
'''