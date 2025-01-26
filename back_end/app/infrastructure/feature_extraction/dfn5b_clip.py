import open_clip
import torch
from PIL.Image import Image
from open_clip import create_model_from_pretrained

class DFN5B_CLIP:
    def __init__(self):
        self.model, self.preprocess = create_model_from_pretrained('hf-hub:apple/DFN5B-CLIP-ViT-H-14-384')
        self.tokenizer = open_clip.get_tokenizer('hf-hub:apple/DFN5B-CLIP-ViT-H-14-384')
        self.model = self.model.to('cuda')
        self.model.eval()

    def extract_feature_text(self, text: str):
        with torch.no_grad(), torch.cuda.amp.autocast():
            text_tokens = self.tokenizer(text).to('cuda')
            return self.model.encode_text(text_tokens)[0]

    def extract_feature_image(self, image: Image):
        with torch.no_grad(), torch.cuda.amp.autocast():
            image = self.preprocess(image).unsqueeze(0).to('cuda')
            return self.model.encode_image(image)[0].tolist()