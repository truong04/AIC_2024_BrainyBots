
from sentence_transformers import SentenceTransformer
from PIL import Image

class OpenAI_CLIP:
    def __init__(self):
        self.model = SentenceTransformer('clip-ViT-L-14')

    def extract_feature_image(self, image: Image):
        image_feats = self.model.encode([image], convert_to_tensor=True,
                                              show_progress_bar=False)
        image_feats /= image_feats.norm(dim=-1, keepdim=True)  # Normalize features
        image_feats = image_feats.cpu().numpy()[0]
        return image_feats

    def extract_feature_text(self, text: str):
        text_feats = self.model.encode([text])
        return text_feats[0]
