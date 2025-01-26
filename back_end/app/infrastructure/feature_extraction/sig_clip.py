import open_clip
import torch
from PIL.Image import Image
from open_clip import create_model_from_pretrained

class SigCLIP:
    def __init__(self):
        self.model, self.preprocess = create_model_from_pretrained('hf-hub:timm/ViT-SO400M-14-SigLIP-384')
        self.tokenizer = open_clip.get_tokenizer('hf-hub:timm/ViT-SO400M-14-SigLIP-384')
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