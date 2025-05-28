# https://aistudio.google.com/prompts/1YzSVjct0VSZgTbwYzvinBiGn85Be2YOb
import os
from transformers import AutoTokenizer
from datasets import Dataset
from sklearn.model_selection import train_test_split
from transformers import AutoModelForMaskedLM, DataCollatorForLanguageModeling
from transformers import Trainer, TrainingArguments

raw_opcode_sequences = [
    "push ebp mov esp ebp sub esp 0x10 mov eax 0x1 call_internal leave retn",
    "xor eax eax mov ecx 0x5 rep stosd mov edi some_addr jmp short_loc",
    "push esi mov esi ecx call_external_api_1 test eax eax jz fail_path mov edi 0x0 pop esi retn"
]

MODEL_NAME = "answerdotai/ModernBERT-base"
NEW_TOKENIZER_DIR = "./opcode_tokenizer"

if not os.path.exists(NEW_TOKENIZER_DIR):
    print(f"Creating and saving a new tokenizer based on {MODEL_NAME}")
    base_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    all_tokens = set()
    for seq in raw_opcode_sequences:
        all_tokens.update(seq.split())


    base_tokenizer.add_tokens(list(all_tokens))
    os.makedirs(NEW_TOKENIZER_DIR, exist_ok=True)

    base_tokenizer.save_pretrained(NEW_TOKENIZER_DIR)
    tokenizer = base_tokenizer
    print(f"Extended tokenizer saved to {NEW_TOKENIZER_DIR}")
else:
    print(f"Loading tokenizer from {NEW_TOKENIZER_DIR}")
    tokenizer = AutoTokenizer.from_pretrained(NEW_TOKENIZER_DIR)


sample_sequence = raw_opcode_sequences[0]
encoded_input = tokenizer(sample_sequence, truncation=True, max_length=512)
print("Sample sequence:", sample_sequence)
print("Tokenized IDs:", encoded_input['input_ids'])
print("Decoded tokens:", tokenizer.convert_ids_to_tokens(encoded_input['input_ids']))


# Split data (optional, but good practice)
train_texts, val_texts = train_test_split(raw_opcode_sequences, test_size=0.1, random_state=42)

# Create Hugging Face Dataset objects
train_dataset_dict = {"text": train_texts}
val_dataset_dict = {"text": val_texts}
train_dataset = Dataset.from_dict(train_dataset_dict)
val_dataset = Dataset.from_dict(val_dataset_dict)

def tokenize_function(examples):

    return tokenizer(examples["text"], truncation=True, max_length=1024, padding="max_length") # Adjust max_length

tokenized_train_dataset = train_dataset.map(tokenize_function, batched=True, remove_columns=["text"])
tokenized_val_dataset = val_dataset.map(tokenize_function, batched=True, remove_columns=["text"])

print("Tokenized training dataset example:", tokenized_train_dataset[0])


model = AutoModelForMaskedLM.from_pretrained(MODEL_NAME)

# IMPORTANT: If you extended the tokenizer (Option A), resize embeddings
# This adds new random vectors for your new tokens in the embedding layer.
# These will be learned during fine-tuning.
if len(tokenizer) > model.config.vocab_size: # Check if vocab size changed
    print(f"Resizing token embeddings from {model.config.vocab_size} to {len(tokenizer)}")
    model.resize_token_embeddings(len(tokenizer))
else:
    print(f"Model vocab size {model.config.vocab_size} matches tokenizer vocab size {len(tokenizer)}.")


data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=True,
    mlm_probability=0.15
)


# Define training arguments
# These are example values, tune them for your specific dataset and resources
# ModernBERT paper mentions training for 1.7T tokens, then 250B, then 50B.
# For fine-tuning, epochs will be much smaller.
training_args = TrainingArguments(
    output_dir="./opcode_modernbert_finetuned",
    overwrite_output_dir=True,
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    gradient_accumulation_steps=2,
    save_strategy="epoch",
    eval_strategy="epoch",
    logging_dir='./logs',
    logging_steps=100,
    fp16=True,
    learning_rate=5e-5,
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
    report_to="tensorboard",
)

# Initialize Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train_dataset,
    eval_dataset=tokenized_val_dataset,
    data_collator=data_collator,
    tokenizer=tokenizer,
)

print("Starting fine-tuning...")
trainer.train()

trainer.save_model("./opcode_modernbert_finetuned/best_model")
tokenizer.save_pretrained("./opcode_modernbert_finetuned/best_model")
print("Fine-tuning complete. Model saved.")