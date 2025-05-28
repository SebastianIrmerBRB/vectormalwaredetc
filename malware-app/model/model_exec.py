import torch
import numpy as np
from transformers import AutoModel, AutoTokenizer # Use AutoModel for feature extraction

# Load the fine-tuned model and tokenizer
FINE_TUNED_MODEL_PATH = "./opcode_modernbert_finetuned/best_model"
tokenizer = AutoTokenizer.from_pretrained(FINE_TUNED_MODEL_PATH)
# Load as AutoModel to get hidden states, not MLM predictions
model = AutoModel.from_pretrained(FINE_TUNED_MODEL_PATH)
model.eval() # Set to evaluation mode
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

def get_opcode_embedding(opcode_sequence_text):
    inputs = tokenizer(opcode_sequence_text, return_tensors="pt", truncation=True, max_length=1024, padding=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)

    # Option 1: Use the [CLS] token's embedding (first token)
    # cls_embedding = outputs.last_hidden_state[:, 0, :].cpu().numpy()
    # return cls_embedding.squeeze()

    # Option 2: Mean pooling of all token embeddings in the last hidden state
    # Attention mask is important to exclude padding tokens from averaging
    attention_mask = inputs['attention_mask']
    mask_expanded = attention_mask.unsqueeze(-1).expand(outputs.last_hidden_state.size()).float()
    sum_embeddings = torch.sum(outputs.last_hidden_state * mask_expanded, 1)
    sum_mask = torch.clamp(mask_expanded.sum(1), min=1e-9)
    mean_pooled_embedding = (sum_embeddings / sum_mask).cpu().numpy()
    return mean_pooled_embedding.squeeze()


# Example: Get embeddings for your original sequences
all_embeddings = []
for seq in raw_opcode_sequences: # Or your test set
    embedding = get_opcode_embedding(seq)
    all_embeddings.append(embedding)
    if len(all_embeddings) % 100 == 0:
        print(f"Generated embeddings for {len(all_embeddings)} sequences...")

all_embeddings_np = np.array(all_embeddings)
print("Shape of all embeddings:", all_embeddings_np.shape) # (num_sequences, hidden_size)

# Now `all_embeddings_np` contains your vectors, ready for visualization (e.g., t-SNE, UMAP)
# np.save("opcode_embeddings_modernbert.npy", all_embeddings_np)